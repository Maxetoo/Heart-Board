const notFoundMiddleware = (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found.` });
};

module.exports = notFoundMiddleware;