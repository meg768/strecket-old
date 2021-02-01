import React from "react";
import {Popover, Button, Container, Table, Row, Col, Badge} from 'react-bootify';
import isArray from 'yow/isArray';
import PropTypes from 'prop-types';
import Request from "yow/request";

require("./looker.less");

const increaseLimit = 0.10; // Hur många procent den måste öka varje kvartal

export default  class Home extends React.Component {
	    
    getIncreaseLimit() {
	    return (increaseLimit * 100).toFixed(0);
    }
	
    constructor(props) {
        super(props);

        this.state = {stocks:[], busy:false};
    }
    
    
    fetch(symbol) {
        return new Promise((resolve, reject) => {

            var request = new Request("http://85.24.185.150:3000");

            request
                .get("/rawdump/" + symbol)
                .then(response => {
                    resolve(response.body);
                })
                .catch(error => {
	                console.log("FEL: fetch:", error);
                    reject(error);
                });
        });
    }
    
        
    componentDidMount() {
        var self = this;
        var request = new Request('http://85.24.185.150:3000');
        var query = {};
        var stocks;
        
        query.sql = 'select symbol from stocks';

        request.get('/mysql', {query:query}).then(response => {
	            
            stocks = response.body;
            
            var loop = (index) => {
                if (index < stocks.length) {
                    self.fetch(stocks[index].symbol).then(rawDump => {
						if (typeof rawDump !== 'undefined' && rawDump != '[]') {		
							if (typeof rawDump.earnings !== 'undefined' && rawDump.earnings != '[]') {		
								if (typeof rawDump.earnings.financialsChart.quarterly !== 'undefined' && rawDump.earnings.financialsChart.quarterly.length == 4) {
									var incr1, incr2, incr3;
									var incr1Revenue, incr2Revenue, incr3Revenue;
									var fcf;
									var noStocks;									
									var q = rawDump.earnings.financialsChart.quarterly;
									
									console.log("---Ticker:", rawDump.price.symbol);
									console.log("earnings=", q[0].earnings, q[1].earnings, q[2].earnings, q[3].earnings);													
									
									if (q[0].earnings > 0 && q[1].earnings > 0 && q[2].earnings > 0 && q[3].earnings > 0) {
										incr1 = (q[1].earnings / q[0].earnings) - 1;
										incr2 = (q[2].earnings / q[1].earnings) - 1;
										incr3 = (q[3].earnings / q[2].earnings) - 1;						

										incr1Revenue = (q[1].revenue / q[0].revenue) - 1;
										incr2Revenue = (q[2].revenue / q[1].revenue) - 1;
										incr3Revenue = (q[3].revenue / q[2].revenue) - 1;						
										
										console.log("increase earnings=", incr1.toFixed(2), incr2.toFixed(2), incr3.toFixed(2));
										console.log("increase revenue=", incr1Revenue.toFixed(2), incr2Revenue.toFixed(2), incr3Revenue.toFixed(2));
										
										if (typeof rawDump.financialData !== 'undefined') {
											console.log("cashflow", rawDump.financialData.freeCashflow);
											fcf = rawDump.financialData.freeCashflow;
										}
											
										if (typeof rawDump.defaultKeyStatistics !== 'undefined') {
											console.log("shares", rawDump.defaultKeyStatistics.sharesOutstanding);
											noStocks = rawDump.defaultKeyStatistics.sharesOutstanding;
										}
										
										// Växer varje kvartal
										var grows = (incr3Revenue > incr2Revenue && incr2Revenue > incr1Revenue);
										
										if (incr1 > increaseLimit && incr2 > increaseLimit && incr3 > increaseLimit) {
											var candidate = {ticker:rawDump.price.symbol, incr1:incr1, incr2:incr2, incr3:incr3, incr1Revenue:incr1Revenue, incr2Revenue:incr2Revenue, incr3Revenue:incr3Revenue, grows:grows, fcf:fcf, noStocks:noStocks};

											self.setState({stocks: this.state.stocks.concat(candidate)});	
										}										
									}
					
								}
								else
									console.log("---Ticker:", rawDump.price.symbol, " kvartalsresultat saknas.");																							
							}
						}
								            			            
                        loop(index + 1);
                    })
                    .catch((error) => {
                        console.log("FEL: från fetch:", error);
                    });
                }
                else {
	                console.log("Done!");
                }    
            };
    
            loop(0);            
            
        })
        .catch(error => {
            console.error(error.message);
        });
				
    }
        
    onCancel() {
        window.history.back();
    }
    
    
    renderStocks() {
        var self = this;

        var items = this.state.stocks.map(function(stock, index) {
            return (
                <tr key={index}>
                    <td>
                    	{stock.ticker}
                    </td>
                    <td style={{textAlign: "right"}}>
                        {(stock.incr1*100).toFixed(2)+'%'}
                    </td>
                    <td style={{textAlign: "right"}}>
                        {(stock.incr2*100).toFixed(2)+'%'}
                    </td>
                    <td style={{textAlign: "right"}}>
                        {(stock.incr3*100).toFixed(2)+'%'}
                    </td>                    
                    <td style={{textAlign: "right"}}>
                        {(stock.incr1Revenue*100).toFixed(2)+'%'}
                    </td>                    
                    <td style={{textAlign: "right"}}>
                        {(stock.incr2Revenue*100).toFixed(2)+'%'}
                    </td>                    
                    <td style={{textAlign: "right"}}>
                        {(stock.incr3Revenue*100).toFixed(2)+'%'}
                    </td>                    
                    <td style={{textAlign: "right"}}>
                        {stock.fcf}
                    </td>                    
                    <td style={{textAlign: "right"}}>
                        {stock.noStocks}
                    </td>                                        
                    <td style={{textAlign: "center"}}>
                        {stock.grows ? (
	                        <Badge color="success">Växer</Badge>
	                    ):(
		                  <div></div>  
	                    )}
                    </td>

                </tr>
            );
        }); 

        if (items.length == 0) {
            if (this.state.error)
                var items = (
                    <tr>
                        <td colSpan="10">
                            <center>{"Kan inte nå servern: " + self.state.error.message}</center>
                        </td>
                    </tr>
                );
            else
                var items = (
                    <tr>
                        <td colSpan="10">
                            <center>{"Inga aktier"}</center>
                        </td>
                    </tr>
                );
        }

        return (
            <div>
                <Table striped={true} bordered={true} responsive={true}>
                    <thead>
                        <tr>
                        	<td colSpan="10">
                            	<center><h1>Mer än {this.getIncreaseLimit() + "% ökning per kvartal"}</h1></center>
							</td>
						</tr>

                        <tr>
                            <th>Ticker</th>
                            <th style={{textAlign: "right"}}>Ökning vinst q1</th>
                            <th style={{textAlign: "right"}}>Ökning vinst q2</th>
                            <th style={{textAlign: "right"}}>Ökning vinst q3</th>
                            <th style={{textAlign: "right"}}>Ökning omsättning q1</th>
                            <th style={{textAlign: "right"}}>Ökning omsättning q2</th>
                            <th style={{textAlign: "right"}}>Ökning omsättning q3</th>
                            <th style={{textAlign: "right"}}>Fcf</th>
                            <th style={{textAlign: "right"}}>Antal aktier</th>                                                        
                            <th>Växer varje kvartal</th>
                        </tr>
                    </thead>

                    <tbody>{items}</tbody>
                </Table>

            </div>
        );
    }
    

    render() {
        return (
            <div id="looker">
                <Container>
                    <Container.Row>
                        <br/>
                    </Container.Row>
                    <Container.Row>
                        <Container.Col>
                            {this.renderStocks()}
                        </Container.Col>
                    </Container.Row>

                    <Container.Row>
                        <Button margin={{left:1, right:1}} color="success" size="lg" onClick={this.onCancel.bind(this)}>
                            Stäng
                        </Button>
                    </Container.Row>
                </Container>
            </div>
        );
    }
};

