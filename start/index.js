const axios = require('axios');

const projectDescription = {
  title: 'Sample Project',
  description: 'This is a sample project description',
  // Add more fields as needed
};

axios
  .post('http://localhost:3000/projects', projectDescription)
  .then((response) => {
    console.log('Project description sent successfully');
  })
  .catch((error) => {
    console.error('Error sending project description:', error.message);
  });