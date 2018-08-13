var express = require('express');
var router = express.Router();
var httpProxy = require('http-proxy');
var axios = require('axios');
var util = require('util');
var qs = require('qs');
var cheerio = require('cheerio');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/login', function(req, res, next) {
  let cookie;
  axios.get('https://ed.ibm-jti.com/indexemployee.asp')
    .then(response => {
      cookie = response.headers['set-cookie'][0];

      return axios.post("https://ed.ibm-jti.com/indexemployee.asp", qs.stringify({
          username: req.body.username, password: req.body.password, okay: "ya"
        }),
        {
          headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            Cookie: cookie,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'content-type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'max-age=0',
            Connection: 'keep-alive',
            Host: 'ed.ibm-jti.com',
            'Upgrade-Insecure-Requests': 1
          }
        }
      )
    })
    .then(response => {
      res.send(cookie);
    })
    .catch(err => {
      res.send(util.inspect(err));
    });
});

router.get('/expenses', function(req, res, next) {
  axios.get('https://ed.ibm-jti.com/employee/personal-tmtexpenses.asp', {
    headers: {
      Cookie: 'ASPSESSIONIDQUDTARQC=MAFNIDAAKDCFAGDPELEODLPH'
    }
  })
    .then(response => {
      res.writeHead(200, {'content-type': 'text/html'});
      res.write(response.data);
      res.end();
    });
});

router.post('/openTransportForm', function(req, res, next) {
  let formID = null;
  let formIDsObject = {};
  
  // Open transport form
  axios.get('https://ed.ibm-jti.com/employee/personal-tmtexpenses.asp', {
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: req.body.cookie,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Cache-Control': 'max-age=0',
      Connection: 'keep-alive',
      Referer: 'https://ed.ibm-jti.com/employee/personal-aformtmttransportdetail.asp',
      Host: 'ed.ibm-jti.com',
      'Upgrade-Insecure-Requests': 1
    }
  })
    .then(response => {
      let $ = cheerio.load(response.data);
      let transportListParsed = $('body > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td > form > table > tbody > tr:nth-child(2) > td > table input[name^="id"]');
      
      for(let i=0; i<transportListParsed.length; i++) {
        formIDsObject['id'+i] = transportListParsed[i].attribs.value
      }
      
      // Open edit page transport form
      return axios.post('https://ed.ibm-jti.com/employee/personal-tmtexpenses.asp', 
        qs.stringify(
          Object.assign({}, formIDsObject, { editview0: 'edit' }, { max: transportListParsed.length - 1 })
        ),
        {
          headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            Cookie: req.body.cookie,
            'content-type': 'application/x-www-form-urlencoded',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Cache-Control': 'max-age=0',
            Connection: 'keep-alive',
            Host: 'ed.ibm-jti.com',
            'Upgrade-Insecure-Requests': 1
          }
        }
      )
    })
    .then(response => {
      //Assing latest formID
      formID = formIDsObject['id0'];
      
      // Open Detail page Transport Form
      return axios.get('https://ed.ibm-jti.com/employee/personal-aformtmttransportdetail.asp?type=tmtxtransport',
        {
          headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            Cookie: req.body.cookie,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'content-type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'max-age=0',
            Connection: 'keep-alive',
            Referer: 'https://ed.ibm-jti.com/employee/personal-aformtmttransportdetail.asp',
            Host: 'ed.ibm-jti.com',
            'Upgrade-Insecure-Requests': 1
          }
        }
      );
    })
    .then(response => {
      res.send({
        html: response.data,
        formID: formID
      });
    })
    .catch(error => {
      res.setHeader('Content-Type', 'application/json');
      res.send(util.inspect(error));
      res.end();
    });
});

router.post('/addExpenses', function(req, res, next) {
  axios.post('https://ed.ibm-jti.com/employee/personal-aformtmttransportdetail.asp', qs.stringify({
      type: 'tmtxtransport',
      start: null,
      end: null,
      upd: 'upd',
      idedit: req.body.formID,
      s1: req.body.s1,
      s2: req.body.transportType,
      s9: req.body.pp,
      s3: 'THE PLAZA-BCA (Menara BCA)',
      s16: 'PROJECT',
      s4: '3',
      s6: '0',
      s7: '0',
      s8: '0',
      s10: '1}}JAKARTA',
      s11: '485}}OFFICE',
      s12: 'OFFICE}}THE PLAZA}}844',
      s13: '656}}THAMRIN 1',
      s14: 'THAMRIN 1}}BCA (Menara BCA)}}2239',
      s15: null,
      add: 'Add'
    }).replace(/%20/g, '+'),
    {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        Cookie: req.body.cookie,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'content-type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'max-age=0',
        Connection: 'keep-alive',
        Referer: 'https://ed.ibm-jti.com/employee/personal-aformtmttransportdetail.asp',
        Host: 'ed.ibm-jti.com',
        'Upgrade-Insecure-Requests': 1
      }
    }
  )
    .then(function(response) {
      res.writeHead(200, {'content-type': 'text/html'});
      res.write(response.data);
      res.end();
    })
    .catch(error => {
      res.setHeader('Content-Type', 'application/json');
      res.send(util.inspect(error));
      res.end();
    })
});

router.post('/saveExpenses', function(req, res, next) {
  axios.post('https://ed.ibm-jti.com/employee/personal-tmtexpenses.asp', qs.stringify({
      addnew: 'Next',
      purpose: 'Protelindo Project Agustus 2018',
      note: 'Application Developer for Protelindo Project at Menara BCA',
      type: 'tmtxtransport',
      idedit: req.body.formID,
      savedet: 'Save',
    }),
    {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        Cookie: req.body.cookie,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'content-type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'max-age=0',
        Connection: 'keep-alive',
        Referer: 'https://ed.ibm-jti.com/employee/personal-aformtmttransportdetail.asp',
        Host: 'ed.ibm-jti.com',
        'Upgrade-Insecure-Requests': 1
      }
  })
    .then(function(response) {
      res.writeHead(200, {'content-type': 'text/html'});
      res.write(response.data);
      res.end();
    })
});

router.post('/saveDraft', function(req, res, next) {
  axios.post('https://ed.ibm-jti.com/employee/personal-tmtexpenses.asp', qs.stringify({
      note: 'Application Developer for Protelindo Project at Menara BCA',
      purpose: 'Protelindo Project Agustus 2018',
      idedit: req.body.formID,
      submit: 'Save Draft'
  }),
  {
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
        Cookie: req.body.cookie,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'content-type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'max-age=0',
        Connection: 'keep-alive',
        Referer: 'https://ed.ibm-jti.com/employee/personal-aformtmttransportdetail.asp',
        Host: 'ed.ibm-jti.com',
        'Upgrade-Insecure-Requests': 1
    }
  })
    .then(function(response) {
      res.writeHead(200, {'content-type': 'text/html'});
      res.write(response.data);
      res.end();
    })
});

module.exports = router;
