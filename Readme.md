# GPT-teamwork

GPT agents acting as a team, each agent with a distinct role, working on a project collaboratively, sharing output using queues.

## Quick start

The apps and agents are started using [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)

The agents and apps to start is configured in the `ecosystem.config.js` file in the project root.

To start the project simply run:

`pm2 start ecosystem.config.js`

To send the first message to kick things off:

`node start`

The `start` folder currently includes a small script to kick things off. It posts a message to the endpoint with the project description to be processed.

TODO: Ask the user for input and send that input

## Project Design

This project is designed as a PNPM workspace.

## Workspaces

The workspaces are:

`agents`
`apps`
`config`
`libs`

### Apps

The `apps` folder contains one or more apps.
The `server` app runs a web server with one or more endpoints which are the entry points for the end user (client) to communicate with the GPT team.

The endpoint takes the incoming project description and puts it on a queue.

### Agents

The `agents` folder contains a number of agents. Each agent should be designed with prompts to pursue specific goals depending on the team role.

Each agent: 
- can subscribe to any queue on the [AMQP](https://www.npmjs.com/package/amqplib) channel.
- can use OpenAI or any other method to generate outputs
- should share their output with the rest of the team on an output queue

### Config

The `config` folder contains shared configuration, currently just a list of queue names

### Shared Libs

The `libs` folder contains functionality that can be reused across agents and apps.

### Tests

The `tests` folder may include E2E tests in the future. 

