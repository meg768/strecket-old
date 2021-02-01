import React from "react";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import {Table, Alert, Spinner, Form, Checkbox, Button} from "react-bootify";

import Request from "yow/request";
import sprintf from "yow/sprintf";

export default class InfoBox extends React.Component {
	
    constructor(args) {
        super(args);

        this.state = {
	        ready: false,
	        rawDump: null
        }
    }
    
    getColor(percentage) {
	    const climateGood = "table-success";
	    const climateAcceptable = "table-warning"; 
	    const climateBad = "table-danger";
	    
	    var p = parseFloat(percentage);

        if (p >= 0.7) return climateGood;

        if (p >= 0.5) return climateAcceptable;
        
        if (p == 0) return "table-secondary";

        else return climateBad;
    }    

    fetch() {
        return new Promise((resolve, reject) => {
            var request = new Request("http://85.24.185.150:3000");

            request
                .get("/rawdump/" + this.props.symbol)
                .then(response => {
                    resolve(response.body);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    componentDidMount() {
        this.setState({ready: false});

        this.fetch()
            .then(rawDump => {
                this.setState({rawDump: rawDump, ready: true});
            })
            .catch(error => {
                this.setState({ready: true});
            });
    }
    
    getStatistics(stockInfo) {
	    
	    if (this.state.rawDump != []) {
			var pegRatio = 0;
			var sharesShort = 0;
			var sharesShortPriorMonth = 0;			
			var dividendYield = 0;
			var marketCap = 0;	
			var currentRatio = 0;
			var quickRatio = 0;
			var debtToEquity = 0;
			var longName = "-";
			var sector = "-";
			var industry = "-";
			var longBusinessSummary = "-";
			var forwardPE = 0;
			var trailingPE = 0;
			var regularMarketPrice = 0;

		    if (this.state.rawDump.defaultKeyStatistics !== undefined) {			    
				pegRatio              = this.state.rawDump.defaultKeyStatistics.pegRatio;
				sharesShort           = this.state.rawDump.defaultKeyStatistics.sharesShort;
				sharesShortPriorMonth = this.state.rawDump.defaultKeyStatistics.sharesShortPriorMonth;
			}

		    if (this.state.rawDump.summaryDetail !== undefined) {
				dividendYield         = this.state.rawDump.summaryDetail.dividendYield;
				marketCap             = this.state.rawDump.summaryDetail.marketCap;
				forwardPE             = (this.state.rawDump.summaryDetail.forwardPE !== undefined) ? this.state.rawDump.summaryDetail.forwardPE : 0;
				trailingPE            = (this.state.rawDump.summaryDetail.trailingPE !== undefined) ? this.state.rawDump.summaryDetail.trailingPE : 0;
			}
	
		    if (this.state.rawDump.financialData !== undefined) {			
				currentRatio          = this.state.rawDump.financialData.currentRatio;
				quickRatio            = this.state.rawDump.financialData.quickRatio;
				debtToEquity          = this.state.rawDump.financialData.debtToEquity;
			}

		    if (this.state.rawDump.price !== undefined) {
				longName              = this.state.rawDump.price.longName;
			    regularMarketPrice    = this.state.rawDump.price.regularMarketPrice;			    
		    }
	
		    if (this.state.rawDump.summaryProfile !== undefined) {
				sector                = this.state.rawDump.summaryProfile.sector;
				industry              = this.state.rawDump.summaryProfile.industry;
				longBusinessSummary   = this.state.rawDump.summaryProfile.longBusinessSummary;			    
		    }
		    			
			stockInfo.score = 0;
		
			stockInfo.pegRatio    = pegRatio;
			stockInfo.pegRatio_OK = (pegRatio <= 1.2 && pegRatio > 0);
			if (stockInfo.pegRatio_OK)
				++stockInfo.score
			
			stockInfo.sharesShort    = parseFloat((1 - (sharesShortPriorMonth/sharesShort))*100).toFixed(2);
			stockInfo.sharesShort_OK = (sharesShort<sharesShortPriorMonth);
			if (stockInfo.sharesShort_OK)
				++stockInfo.score
			
			stockInfo.dividendYield    = (dividendYield * 100).toFixed(2);
			stockInfo.dividendYield_OK = (dividendYield !== undefined && dividendYield !== 0);
			if (stockInfo.dividendYield_OK)
				++stockInfo.score
	
			stockInfo.currentRatio    = currentRatio;
			stockInfo.currentRatio_OK = (currentRatio <= 1 && currentRatio > 0);
			if (stockInfo.currentRatio_OK)
				++stockInfo.score
			
			stockInfo.quickRatio    = quickRatio;
			stockInfo.quickRatio_OK = (quickRatio >= 1 && quickRatio > 0);
			if (stockInfo.quickRatio_OK)
				++stockInfo.score
			
			stockInfo.debtToEquity    = debtToEquity;
			stockInfo.debtToEquity_OK = (debtToEquity < 35 && debtToEquity > 0);
			if (stockInfo.debtToEquity_OK)
				++stockInfo.score
			
			stockInfo.forwardPE    = (forwardPE).toFixed(0);
			stockInfo.forwardPE_OK = (forwardPE < 15 && forwardPE > 0);
			if (stockInfo.forwardPE_OK)
				++stockInfo.score
			
			stockInfo.trailingPE    = (trailingPE).toFixed(0);
			stockInfo.trailingPE_OK = (trailingPE < 25 && trailingPE > 0);
			if (stockInfo.trailingPE_OK)
				++stockInfo.score
			
			stockInfo.marketCap    = Intl.NumberFormat("SE").format(marketCap);
			stockInfo.marketCap_OK = (marketCap < 5000000000 && marketCap > 0); // Market Cap < $5 billion
			if (stockInfo.marketCap_OK)
				++stockInfo.score
			
			stockInfo.longName            = longName;
			stockInfo.sector              = sector;
			stockInfo.industry            = industry;
			stockInfo.longBusinessSummary = longBusinessSummary;
			
			if (regularMarketPrice != 0) {
				stockInfo.atr = ((this.props.atr/regularMarketPrice)*100).toFixed(2) + "% (" + (this.props.atr).toFixed(2) + ")";
				stockInfo.atr_OK = (((this.props.atr/regularMarketPrice)*100) < 2.5);
				if (stockInfo.atr_OK)		
					++stockInfo.score				
			}
			else
				stockInfo.atr_OK = false;
			
			stockInfo.maxDrop = Math.min.apply(null, this.props.drops);
			stockInfo.maxDrop_OK = (stockInfo.maxDrop > -6);
			if (stockInfo.maxDrop_OK)		
				++stockInfo.score
	
			if (this.state.rawDump.earnings !== undefined) {		
				if (this.state.rawDump.earnings.financialsChart.quarterly !== undefined) {
					
					stockInfo.earnings = [];
					stockInfo.revenue = [];
					stockInfo.quarters = [];			
					
					for (var i in this.state.rawDump.earnings.financialsChart.quarterly) {
						stockInfo.earnings.push(this.state.rawDump.earnings.financialsChart.quarterly[i].earnings);
						stockInfo.revenue.push(this.state.rawDump.earnings.financialsChart.quarterly[i].revenue);
						stockInfo.quarters.push(this.state.rawDump.earnings.financialsChart.quarterly[i].date);				
					}
				}			
			}
		}

    }
    
    
	render() {
        var self = this;
        var stockInfo = [];
        	    
        if (this.state.ready) {
            var style = {};
            style.border = "1px solid rgba(0, 0, 0, 0.1)";
            style.marginLeft = "10em";
            style.marginRight = "10em";
            style.marginTop = "5em";
            style.marginBottom = "5em";
                    
			self.getStatistics(stockInfo);
			
			if (this.state.rawDump.length == 0) {
	            return (
	                <div style={style}>
	                    <Table responsive={true} size={'sm'}>
	                        <tbody>
	                            <tr>
	                                <td colSpan="6" className="table-primary">
	                                    <h3 className="text-center">Info saknas.</h3>
	                                </td>
	                            </tr>
	                        </tbody>
	                    </Table>
	                    
	                </div>
	            );				
			}
			
			var configEarnings = {
				chart: {
				    type: 'column'
				},
				title: {
					text: ''	
				},
			    xAxis: {
			        categories: stockInfo.quarters
			    },
				yAxis: {
			        title: {
			            text: ''
			        }
			    },			    				
				series: [{
					name: 'Vinst',
					data: stockInfo.earnings
				}]
			}	            			

			var configRevenue = {
				chart: {
				    type: 'column'
				},
				title: {
					text: ''	
				},
			    xAxis: {
			        categories: stockInfo.quarters
			    },
				yAxis: {
			        title: {
			            text: ''
			        }
			    },			    				
				series: [{
					name: 'Omsättning',
					data: stockInfo.revenue
				}]
			}
                        
            var x = stockInfo.industry;
            
			var sector = this.props.sectors.find(sector => sector.industry == x); // Är denna aktie i en trendande sektor? om så -> sektor.perc visar hur många aktier i sektorn som trendar upp
			
			if (sector !== undefined) {
				if (sector.perc > 0.5)
					++stockInfo.score;
			}
			else {
				sector = {};
				sector.perc = 0;
			}

            return (
                <div style={style}>
                    <Table responsive={true} size={'sm'}>
                        <tbody>
                            <tr>
                                <td colSpan="6" className="table-primary">
                                    <h3>{stockInfo.longName + " (" + stockInfo.industry + ", " + stockInfo.sector + "), "}<strong>{stockInfo.score}</strong></h3>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="6" className="table-primary">
                                	<small>{stockInfo.longBusinessSummary}</small>
                                </td>
                            </tr>                        
                            <tr>
                                <td className={ stockInfo.pegRatio_OK ? 'table-success' : 'table-danger'}>
                                    <h5 className="text-white text-center">{"PEG: " + stockInfo.pegRatio}</h5>
                                </td>
                                <td className={ stockInfo.dividendYield_OK ? 'table-success' : 'table-danger'}>
                                    <h5 className="text-white text-center">{"Utdelning: " + stockInfo.dividendYield}%</h5>
                                </td>
                                <td className={ stockInfo.currentRatio_OK ? 'table-success' : 'table-danger'}>
                                    <h5 className="text-white text-center">{"Current ratio: " + stockInfo.currentRatio}</h5>
                                </td>
                                <td className={ stockInfo.quickRatio_OK ? 'table-success' : 'table-danger'}>
                                    <h5 className="text-white text-center">{"Quick ratio: " + stockInfo.quickRatio}</h5>
                                </td>
                                <td className={ stockInfo.sharesShort_OK ? 'table-success' : 'table-danger'}>
                                    <h5 className="text-white text-center">{"Blankare: " + stockInfo.sharesShort}%</h5>
                                </td>
                                <td className={ stockInfo.maxDrop_OK ? 'table-success' : 'table-danger'}>
                                    <h5 className="text-white text-center">{"Maxdrop (100d): " + stockInfo.maxDrop + "%"}</h5>
                                </td>
                            </tr>
                            <tr>
                                <td className={ stockInfo.debtToEquity_OK ? 'table-success' : 'table-danger'}>
                                    <h5 className="text-white text-center">{"Skuld/Eget kapital: " + stockInfo.debtToEquity}</h5>
                                </td>
                                <td className={ stockInfo.forwardPE_OK ? 'table-success' : 'table-danger'}>
                                    <h5 className="text-white text-center">{"Forward P/E: " + stockInfo.forwardPE}</h5>
                                </td>
                                <td className={ stockInfo.trailingPE_OK ? 'table-success' : 'table-danger'}>
                                    <h5 className="text-white text-center">{"Trailing P/E: " + stockInfo.trailingPE}</h5>
                                </td>
                                <td className={ stockInfo.marketCap_OK ? 'table-success' : 'table-danger'}>
                                    <h5 className="text-white text-center">{"Marknadsvärde: " + stockInfo.marketCap}</h5>
                                </td>
                                <td className={self.getColor(sector.perc)}>
                                    <h5 className="text-white text-center">Industri</h5>
                                </td>
                                <td className={stockInfo.atr_OK ? 'table-success' : 'table-danger'}>
                                    <h5 className="text-white text-center">{"ATR: " + stockInfo.atr}</h5>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="3" className="text-center">
									<HighchartsReact
									    highcharts={Highcharts}
									    options={configEarnings}
									  />                                
								</td>
                                <td colSpan="3" className="text-center">
									<HighchartsReact
									    highcharts={Highcharts}
									    options={configRevenue}
									  />                                
								</td>
                            </tr>
                        </tbody>
                    </Table>
                    
                </div>
            );
        } else {
            return (<div><Spinner type="grow"/></div>);
        }
    }


};


