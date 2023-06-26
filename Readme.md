<!-- vscode-markdown-toc -->
* 1. [AI team](#AIteam)
* 2. [Quick start](#Quickstart)
* 3. [Project Design](#ProjectDesign)
* 4. [Workspaces](#Workspaces)
	* 4.1. [Run commands with Nx](#RuncommandswithNx)
	* 4.2. [Start](#Start)
	* 4.3. [Apps](#Apps)
	* 4.4. [Agents](#Agents)
	* 4.5. [Software Development Life Cycle (SDLC)](#SoftwareDevelopmentLifeCycleSDLC)
* 5. [Phase folder instructions](#Phasefolderinstructions)
	* 5.1. [Parallel tasks](#Paralleltasks)
	* 5.2. [Task processing](#Taskprocessing)
	* 5.3. [Shared Libs](#SharedLibs)
	* 5.4. [Channels](#Channels)
	* 5.5. [Tests](#Tests)

<!-- vscode-markdown-toc-config
	numbering=true
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc --># GPT-teamwork

GPT agents acting as a team, each agent with a distinct role, working on a project collaboratively, sharing output using queues.

##  1. <a name='AIteam'></a>AI team

Prompt engineering examples and experiments for the AI engineering team can be found in the folder

`ai-team`

Example:

```txt
Please write an App component with a header, footer, left sidebar, right sidebar and top menu with navigation to sub pages. The page should have a React Router with an Outlet to display each page routed to.

Each component should be placed in a separate file. Make sure that any component or functionality that is reused in multiple components is extracted into its own file and referenced. 
```

##  2. <a name='Quickstart'></a>Quick start

The apps and agents are started using [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)

The agents and apps to start is configured in the `ecosystem.config.js` file in the project root.

Install

`pnpm run -r install`

Build

`pnpm run -r build`

To start the project (web server and all agents) simply run:

`pm2 start ecosystem.config.js`

To interact with the system and kick things off:

`node start/cli`

##  3. <a name='ProjectDesign'></a>Project Design

This project is designed as a PNPM workspace.

See [Managing a full-stack, multipackage monorepo using pnpm](https://blog.logrocket.com/managing-full-stack-monorepo-pnpm/)

##  4. <a name='Workspaces'></a>Workspaces

The workspaces are:

- `agents`
- `apps`
- `libs`
- `start`

See [Setup a monorepo with pnpm & add Nx for speed](https://blog.nrwl.io/setup-a-monorepo-with-pnpm-workspaces-and-speed-it-up-with-nx-bc5d97258a7e)

Run a npm command on a single workspace

`pnpm run --filter @gpt-team/phases build`

Build all packages in the workspace

`pnpm run -r build`

You can parallelize the run by using `--parallel`

Add a package to the ai workspace

`pnpm add --filter ai openai`

###  4.1. <a name='RuncommandswithNx'></a>Run commands with Nx

Build `ai` workspace

`npx nx build ai`

Build all

`npx nx run-many --target=build --all`

###  4.2. <a name='Start'></a>Start

The `start` folder will include various ways to start/intertact with the system.

Currently `start` includes a `cli` project which lets you input the title and description for a project which is sent to the server projects endpoint via a `POST` request (axios).

###  4.3. <a name='Apps'></a>Apps

The `apps` folder contains one or more apps.
The `server` app runs a web server with one or more endpoints which are the entry points for the end user (client) to communicate with the GPT team.

The endpoint takes the incoming project description and puts it on a queue.

###  4.4. <a name='Agents'></a>Agents

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

###  4.5. <a name='SoftwareDevelopmentLifeCycleSDLC'></a>Software Development Life Cycle (SDLC)

The SDLC for any sub/team or engineer is roughly as follows:

- analysis
- design
- development & testing
- deployment

Each agent can define a `phases` folder with a `phase-order.yaml` file.
The phases folder should contain one folder per phase, such as `analysis`.

##  5. <a name='Phasefolderinstructions'></a>Phase folder instructions

The particular phase folder such as `analysis` should have

A `goal.md` describing the goal of that phase for the particular agent (to be fed as first input to AI).

There should also be a `phase-tasks` folder with a folder for each type of task, such as `use-cases` 
The `phase-tasks` folder should have a `task-order.yaml` files which outlines the order of tasks to be performed.

`task-order.yaml`

```yaml
- [requirements, features]
- user-personas
- user-stories
- story-boarding
```

###  5.1. <a name='Paralleltasks'></a>Parallel tasks

If tasks can be performed in parallel you can put several task names for an item, such as `[requirements, features]` (not yet supported)

###  5.2. <a name='Taskprocessing'></a>Task processing

The agent will process tasks in phase and task order to eventually create deliverables. 
For a UI agent this may include use case diagrams, user stories, design system description and UI/UX code etc.

To load the phases and tasks use the tooling in `@gpt-team/phases` under the `libs/phases` folder.

Each phase task is a folder (by default) which can have:

- one or more text files used as AI prompts
- `config.yaml` file with details for how to run this task

The config may include

- User `inputs`: User prompts to ask the user to feed additional information
- `channel` info: `subscribe` and `publish` channels 
- What to `output`: 
  - `name` such as `use cases`
  - `type` ie. `diagram`, `code`, `documentation`, ...
  - `format` 
  - etc.

In general, the only major step left in this design is to implement the proper step logic leveraging the phases/tasks architecture.

###  5.3. <a name='SharedLibs'></a>Shared Libs

The `libs` folder contains functionality that can be reused across agents and apps.

The `@gpt-team/channel` library contains messaging channel functionality, including shared configuration (currently just a list of queue names).

The `@gpt-team/ai` library contains AI functionality (currently from `GPT-engineer`).

The `@gpt-team/db` library contains DB functionality to maintain AI context, logging etc.

###  5.4. <a name='Channels'></a>Channels

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

###  5.5. <a name='Tests'></a>Tests

The `tests` folder may include E2E tests in the future. 

