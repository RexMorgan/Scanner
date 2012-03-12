var jsdom  = require('jsdom')
  , fs     = require('fs')
  , jquery = fs.readFileSync('./jquery-1.7.1.min.js').toString();  

/*var neo4j = require('neo4j')
  , db    = new neo4j.GraphDatabase('http://localhost:7474');*/

var kue  = require('kue')
  , jobs = kue.createQueue();

var cluster = require('cluster');

if(cluster.isMaster) {
  kue.app.listen(3000);
  kue.app.set('title', 'scanner');

  for(var i = 0; i < 8; i++) {
    cluster.fork();
  }

  cluster.on('death', function(worker) {
    console.log('worker ' + worker.pid + ' died');
  });
} else {
  jobs.process('scan', 50, handleScan);
}

function handleScan(job, done) {
  if(job.data.url.indexOf('http') === 0) {
    jsdom.env({
      html: job.data.url,
      src: [ jquery ],
      done: function (err, win) {
        if(err) {
          done('error with url');
        } else {
          var $ = win.$;
          $('a').each(function() {
            var njob = jobs.create('scan', {
              url: $(this).attr('href'),
              source: job.data.url
            });
            njob.save();
	    njob.log('scanning %s', njob.data.url);
          });
          done();
        }
      }
    });
  } else {
    done('invalid url.');
  }
}

/*jsdom.env({
	html: 'http://news.ycombinator.com',
	src: [ jquery ],
	done: function(errors, window) {
		var $ = window.$;
		$('a').each(function() {
			console.log($(this).attr('href'));
		});
	}
});*/
