# react-three
* Created with CodeSandbox
* [View/edit](https://codesandbox.io/p/github/markNZed/react-three) the CodeSandBox
* Also configured to run as a Github Codespace
* This might be a way to record video of an animation https://github.com/gsimone/use-capture

To work with this project on a remote server (assuming the server has SSH, Docker installed, and a clone of this repo)
* Connect to the server via SSH with VS Code and open the folder with the cloned repo
* From VS Code command palette: Dev Containers: Rebuild and Reopen in Container
* There may be directory permission problems (the directory on the server is owned by a different user than the user in the docker container)
  * From the terminal inside VS Code: `sudo chown -R node:node /workspaces/react-three`
  * Then need to complete the setup manually: `npm install` `npm start`
* Needed to configure Git from VS Code terminal 
  * git config --global user.email "your_email@example.com"
  * git config --global user.name "your_name"

[Build](https://marknzed.github.io/react-three)

Development Guidelines

* A variant is best when we can animate using Motion. A property is best when we are animating outside of Motion. For example visibility does not need Motion. The camera is animated using react-spring not Motion. The basic idea of a variant it to define a "state" of the component.
* The AnimationController should mainly control the sequencing of variants.