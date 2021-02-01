import React from 'react';
import {HashRouter, Switch, Route} from "react-router-dom";

import Home from './pages/home/home.js';
import Meg from './pages/meg/meg.js';
import Looker from './pages/looker/looker.js';
import SellStock from './pages/sell-stock/sell-stock.js';
import Evaluate from './pages/evaluate/evaluate.js';
import NewStock from './pages/new-stock/new-stock.js';
import Candidates from './pages/candidates/candidates.js';

export default class App extends React.Component {

    render() {
        return (
			<HashRouter>
				<Switch>
					<Route exact path="/" component={Home}/>
					<Route path="/meg" component={Meg}/>
					<Route path="/looker" component={Looker}/>
					<Route path="/sell-stock" component={SellStock}/>
					<Route path="/evaluate" component={Evaluate}/>
					<Route path="/new-stock" component={NewStock}/>
					<Route path="/candidates" component={Candidates}/>
		
					
				</Switch>
			</HashRouter>			
        );

    }
};

