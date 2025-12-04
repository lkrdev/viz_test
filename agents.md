# Setup

- use yarn for everything, forget that npm exists.
- if this is your first time running this repository, you can use `yarn init:all` to initialize all the packages and dependencies. you're welcome.
- if you you think you have a problem with node_modules and installed packages, use `yarn clean:all` to clean everything and re-initialize.
- if you are creating a new package, use the create-test-template.sh script to create the test template.

# Editing

- the top level package.json should not have any dependencies, it should only have scripts.
- When you are developing a new or existing visualization, you should ask the the Jules user for help with providing query ids. These query ids will help you visualize the data. They should go in ./test_app/src/__tests__/<package_name>/queries.ts when the user gives them to you. 

# Testing

- you must not use `yarn test:query-visualization --all` or `yarn test:query-render --all`. It's only for testing the entire repository. When you need to test the visualization you are building, use `yarn test:query-visualization -P <package_name>` or `yarn test:query-render -P <package_name>`

# Building a new visualization

- When you are building a new visualization, always start with the create-test-template.sh and create-visualization-template.sh scripts to create the test template.
- 

# When to use new packages

Unless you are specifically asked to use a new package with `yarn install` do your best to meet the user's request with packages that are already installed. You can use `yarn all-npm-packages` to see all the packages that are available across all packages.