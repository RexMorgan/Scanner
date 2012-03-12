var kue  = require('kue')
  , jobs = kue.createQueue();

var scan_url = 'http://news.ycombinator.com/';

var job = jobs.create('scan', { url: scan_url, source: '' });
job.save();
job.log('scanning %s', scan_url);
