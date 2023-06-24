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
`libs`

See [Setup a monorepo with pnpm & add Nx for speed](https://blog.nrwl.io/setup-a-monorepo-with-pnpm-workspaces-and-speed-it-up-with-nx-bc5d97258a7e)

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

Current agents:

- `@gpt-team/ui-agent` with responsibility to deliver UI functionality
- `@gpt-team/api-agent` with responsibility to deliver API functionality
- `@gpt-team/fs-writer` with responsibility to extract file info from deliverables and write to file system
  
One of the primary goals of each agent is to create deliverables that can be written to the file system as project artifacts.

Output that is a deliverables should be marked with `[-DELIVERABLE-]`. The `fs-writer` agent will recognize this marker and use it to parse the output for file info and write the file to disk.

This could further be expanded to include writing files to local and remote git repos etc.  

### Shared Libs

The `libs` folder contains functionality that can be reused across agents and apps.

The `@gpt-team/channel` library contains messaging channel functionality, including shared configuration (currently just a list of queue names).

The `@gpt-team/ai` library contains AI functionality (currently from `GPT-engineer`).

The `@gpt-team/db` library contains DB functionality to maintain AI context, logging etc.

### Channels

Currently the following channels are available

- `all` for messages to be made available to all (broadcast)
- `architect` for architecture tasks
- `product` for product tasks
- `project` for project info and tasks
- `ui` for general UI/UX tasks
- `frontend` for general FE tasks
- `backend` for general BE tasks
- `devops` for DevOps tasks including CI/CD and deployment configuration
- `api` for API tasks
- `services` for service tasks
- `db` for DB/storage related tasks
- `deliverables` for deliverables
- `status` to monitor and check product status

### Tests

The `tests` folder may include E2E tests in the future. 

