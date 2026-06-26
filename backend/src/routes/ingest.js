const express = require('express');
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');
const {
  createJob,
  updateJob,
  getJob,
  hasActiveJob,
} = require('../jobs/jobStore');

const router = express.Router();

router.post('/trigger', (req, res, next) => {
  try {
    if (hasActiveJob()) {
      return res.status(409).json({
        error: 'Ingestion already running',
      });
    }

    const jobId = crypto.randomUUID();
    createJob(jobId);

    const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
    const scraperPath = path.resolve(__dirname, '../../../scraper/main.py');
    const scraperCwd = path.resolve(__dirname, '../../../scraper');

    const child = spawn(pythonExecutable, [scraperPath, '--mode=incremental'], {
      cwd: scraperCwd,
      env: { ...process.env },
    });

    let stderrData = '';

    child.on('spawn', () => {
      updateJob(jobId, { status: 'running' });
    });

    child.stdout.on('data', (data) => {
      console.log(`[Scraper stdout] ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
      const errStr = data.toString();
      stderrData += errStr;
      console.error(`[Scraper stderr] ${errStr.trim()}`);
    });

    child.on('error', (err) => {
      console.error('Failed to start scraper process:', err);
      updateJob(jobId, {
        status: 'failed',
        finishedAt: new Date(),
        error: err.message || 'Failed to spawn scraper process',
      });
    });

    child.on('close', (code) => {
      console.log(`Scraper process exited with code ${code}`);
      const job = getJob(jobId);
      if (job && job.status === 'failed') {
        return;
      }

      if (code === 0) {
        updateJob(jobId, {
          status: 'done',
          finishedAt: new Date(),
        });
      } else {
        updateJob(jobId, {
          status: 'failed',
          finishedAt: new Date(),
          error:
            stderrData.trim() || `Scraper exited with non-zero code ${code}`,
        });
      }
    });

    res.status(202).json({
      jobId,
      status: 'pending',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
    });
  }

  res.json({
    jobId: job.jobId,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    error: job.error,
  });
});

module.exports = router;
