
import React from "react";
import {
	HashRouter,
  Switch,
  Route,
  Link
} from "react-router-dom";

export default function App() {
  return (
    <HashRouter >
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home using Link</Link>
            </li>
            <li>
              <Link to="/about">About using Link</Link>
            </li>
            <li>
              <Link to="/users">Users using Link</Link>
            </li>
            <li>
              <a href="/users">Users using href</a>
            </li>
          </ul>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/users">
            <Users />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </HashRouter>
  );
}

function Home() {
  return <h2>Home</h2>;
}

function About() {
  return <h2>About</h2>;
}

function Users() {
  return <h2>Users</h2>;
}
