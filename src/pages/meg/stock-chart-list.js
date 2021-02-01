import React from 'react';
import StockChart from './stock-chart.js';


export default class StockChartList extends React.Component {

    constructor(args) {
        super(args);
    }
    
	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.tickers == "";
	}    
    
    render() {
        var children = this.props.symbols.map((symbol, index) => {
            return (
	        	<StockChart key={index} symbol={symbol} sectors={this.props.sectors} callback={this.props.callback}></StockChart>
            );
        });

        return (
            <div>
                {children}
            </div>
        );
    }
}
