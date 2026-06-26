// TODO:
// Implement lightweight checks for request inputs.
// If validating clusters/:id, verify ":id" parameter is a valid integer.
// Reject malformed queries with a 400 Bad Request and clean JSON details.

function validateClusterId(req, res, next) {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return res.status(400).json({
      error: 'Invalid cluster id. It must be an integer.',
    });
  }

  req.params.idVal = parsedId;
  next();
}

function validateClusterQuery(req, res, next) {
  const { page, limit, source } = req.query;

  if (page !== undefined) {
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        error: 'Invalid page query parameter. It must be a positive integer.',
      });
    }
    req.query.pageVal = parsedPage;
  } else {
    req.query.pageVal = 1;
  }

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({
        error: 'Invalid limit query parameter. It must be a positive integer.',
      });
    }
    req.query.limitVal = parsedLimit;
  } else {
    req.query.limitVal = 20;
  }

  if (
    source !== undefined &&
    (typeof source !== 'string' || source.trim() === '')
  ) {
    return res.status(400).json({
      error: 'Invalid source query parameter. It must be a non-empty string.',
    });
  }

  next();
}

module.exports = {
  validateClusterId,
  validateClusterQuery,
};
