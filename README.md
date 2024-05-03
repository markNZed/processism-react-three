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
