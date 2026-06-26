const express = require('express');
const {
  validateClusterId,
  validateClusterQuery,
} = require('../middleware/validate');
const queries = require('../db/queries');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const clusters = await queries.getAllClusters();
    res.json(clusters);
  } catch (error) {
    next(error);
  }
});

router.get(
  '/:id',
  validateClusterId,
  validateClusterQuery,
  async (req, res, next) => {
    try {
      const { idVal } = req.params;
      const { pageVal, limitVal, source } = req.query;

      const cluster = await queries.getCluster(idVal);
      if (!cluster) {
        return res.status(404).json({ error: 'Cluster not found' });
      }

      const offset = (pageVal - 1) * limitVal;
      const articles = await queries.getArticlesByClusterId(idVal, {
        source,
        limit: limitVal,
        offset,
      });

      res.json({
        ...cluster,
        articles,
        page: pageVal,
        limit: limitVal,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
