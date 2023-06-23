module.exports = {
  apps : [{
    name: 'server',
    script: './apps/server/index.js',
    // watch: '.'
  }, {
    name: 'ui-agent',
    script: './agents/ui-agent/index.js/',
    // watch: ['./service-worker']
  }],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
