# Burger Club - Full-stack restaurant ordering platform

Burger Club is a Sydney local restaurant ordering system for pickup and
delivery. It demonstrates a full-stack customer ordering flow, staff kitchen
console, live menu management, authenticated profiles, cart validation, AUD
checkout totals, and Stripe payments.

The frontend is built with React and TypeScript. The backend API handles menu
versioning, cart validation, order creation, Stripe Checkout, signed webhook
payment updates, staff access, and email workflows.

Stripe payments require these backend environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL` (optional, defaults to the profile page)
- `STRIPE_CANCEL_URL` (optional, defaults to the profile page)

This frontend was originally bootstrapped with
[Create React App](https://github.com/facebook/create-react-app).

## Architecture conventions

### Hooks (placement rules)

Use these rules for **new** hooks. Existing files can stay where they are until a change in that area makes a move worthwhile (incremental migration, not a big-bang directory rewrite).

1. **`store/<domain>/hooks/`** — hooks bound to **one** domain context or store (read/write that API only).  
   Examples: `useAuth`, cart persistence / quote hooks that only touch cart context.

2. **`features/<domain>/hooks/`** — **feature-level** behavior: business logic that is not “just” store wiring (e.g. infinite list + request orchestration, checkout flow, order polling).  
   If the repo does not yet have a `features/` tree, keep these temporarily under `src/hooks/` and move them when that layout exists.

3. **`src/hooks/`** (or a future **`shared/hooks/`**) — **generic, reusable** hooks with no domain ownership.  
   Examples: `useDebounce`, `useLocalStorage`, `useIntersectionObserver`.

**Why three layers:** with only `store/.../hooks` and `src/hooks/`, feature-level hooks tend to pile into `src/hooks/` until it becomes a junk drawer. The middle layer keeps feature logic discoverable as the app grows (orders, payments, profile, etc.).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
