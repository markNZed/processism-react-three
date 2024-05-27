# React-Three

A project built with React and Three.js to manage and animate 3D scenes using Zustand for state management, and Framer Motion for animation. The project includes components for dynamic and interactive 3D entities, and leverages `react-three-fiber` for rendering and `@react-three/drei` for helper components.

## Project Setup

### Prerequisites

Ensure you have the following installed on your development environment:
- Node.js (>= 12.x)
- npm (>= 6.x)

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/markNZed/react-three.git
cd react-three
npm install
```

### Running the Development Server

To start the development server, run:

```bash
npm start
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

## Deployment

To deploy the project to GitHub Pages, use the following command:

```bash
npm run deploy
```

You can then view your deployed site at [https://markNZed.github.io/react-three](https://markNZed.github.io/react-three).

## Development Guidelines

### Animation Components

- **Variants**: Variants represent states of an animation component. Framer Motion is used for animating these variants whenever possible. The `animationState` holds the variant and other values needed for animations.
- **Visibility**: The visibility of components does not necessarily require Motion and can be controlled through the `animationState`.
- **Camera Animation**: The camera is animated using `react-spring` instead of Framer Motion.

### Scene Management

- **Scenes**: A Scene consists of `animationComponents` that are instantiated and an `animationSequence` that dictates the order of animations.
- **Animation Speed**: The speed in `AnimationController` can be used to accelerate the animation sequence for faster transitions.

### Switching Scenes

The `SceneSelector` component allows you to switch between different scenes. See [SceneSelector.js](src/SceneSelector.js) for implementation details.

### Animation Sequence

Define the animation sequence for a scene in an array, specifying delays, component IDs, and animation states. Refer to [SceneOne.js](src/scenes/SceneOne.js) and [SceneThree.js](src/scenes/SceneThree.js) for examples.

### Camera Adjustments

Use the `CameraAdjuster` component to handle camera adjustments on window resize. Check out [App.js](src/App.js) for how it integrates with the canvas.

### Additional Resources

- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## Working Remotely

To work with this project on a remote server (assuming the server has SSH, Docker installed, and a clone of this repo):

1. Connect to the server via SSH with VS Code and open the folder with the cloned repo.
2. From VS Code command palette: `Dev Containers: Rebuild and Reopen in Container`.
3. If there are directory permission issues (the directory on the server is owned by a different user than the user in the docker container):
   - From the terminal inside VS Code: `sudo chown -R node:node /workspaces/react-three`.
   - Complete the setup manually: `npm install` and `npm start`.
4. Configure Git from VS Code terminal:
   - `git config --global user.email "your_email@example.com"`
   - `git config --global user.name "your_name"`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Additional Notes

- Created with CodeSandbox
- View/edit the project on CodeSandbox: ([https://codesandbox.io/p/github/markNZed/react-three](https://codesandbox.io/p/devbox/github/markNZed/react-three))
- Configured to run as a GitHub Codespace
- For recording video of an animation, consider using [use-capture](https://github.com/gsimone/use-capture)
