import axios from 'axios';
import psp from "prompt-sync";
const prompt = psp({ sigint: true });
const title = prompt("What is the title of your project?");
const description = prompt("Describe your project?");

const projectDescription = {
  title,
  description,
  // Add more fields as needed
};

axios
  .post('http://localhost:3000/projects', projectDescription)
  .then((_) => {
    console.log('Project description sent successfully');
  })
  .catch((error) => {
    console.error('Error sending project description:', error.message);
  });