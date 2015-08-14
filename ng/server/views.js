var express = require('express'),
  router = express.Router();

module.exports = function (app) {
  app.use('/', router);
};

var viewRegexp = /^\/(modules(?:\/[A-Za-z0-9\-\_]+)+)\.html$/;

router.route('/modules/*')
	.get(function (req, res, next) {
		//res.render('modules/' + req.url.replace('/modules/', ''));

    var match = viewRegexp.exec(req.path);
    if (match) {
      res.render(match[1], function(err, html) {
        if (err) {
          if (err.message.indexOf('Failed to lookup view') !== -1) {
            res.status(404).send('Template not found.');
          } else {
            logger.error(err);
            res.status(500).send('An unexpected error occurred.');
          }
        }

        res.send(html);
      });
    } else {
      res.status(404).send('View not found');
    }

	});

router.route('/*')
	.get(function(req, res, next) {
		res.render('index');
	});


