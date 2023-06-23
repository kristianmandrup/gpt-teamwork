# GPT-teamwork

This project is designed as a PNPM workspace.

The workspaces are:

`agents`
`apps`
`libs`

The `apss` folder contains oen or more apps.
The `server` app runs a web server with one or more endpoints which are the entry points for the end user (client) to communicate with the GPT team.

The `agents` folder contains a number of agents. Each agent should be designed with prompts to pursue specific goals depending on the team role.

Each agent: 
- can subscribe to messages/topics of interest.
- can use OpenAI or any other method to generate outputs
- should share their output with the rest of the team on an output queue.

The `libs` folder contains functionality that can be reused across agents and apps.

The `tests` folder may include E2E tests in the future. 

The endpoint takes the incoming project description and puts it on a queue.

The apps and agents are started using [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)

Which agents and apps to start is configured in the `ecosystem.config.js` file in the project root.

To start the project simply run:

`pm2 start ecosystem.config.js`

To send the first message to kick things off:

`node start`

The `start` folder currently includes a small script to kick things off. It posts a message to the endpoint with the project description to be processed.

TODO: Ask the user for input and send that input