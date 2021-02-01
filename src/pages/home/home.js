import React from "react";
import {Popover, Button, Container, Table, Row, Col} from 'react-bootify';
import {Sparklines, SparklinesLine, SparklinesReferenceLine, SparklinesBars} from 'react-sparklines';
import {BarChart, Bar, Tooltip} from 'recharts';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

require("./home.less");
var config = require('../config.js');

const RenderBar = (props) => {
  const { fill, x, y, width, height } = props;
  return <rect x={x} y={height>0?y:y+height} width={width} height={Math.abs(height)} stroke="none" fill={height>0?fill:"lightcoral"}/>;
};

RenderBar.propTypes = {
  fill: PropTypes.string,
  x: PropTypes.number, 
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
};


function dayDiffPosix(UNIX_timestamp) {
    var dt1 = new Date(UNIX_timestamp * 1000);
    var dt2 = new Date();
    
    if (UNIX_timestamp == null) return "n/a";    
    
    return Math.floor((Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate()) - Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate())) / (1000 * 60 * 60 * 24));
}


function dayDiff(d) {
    var dt1 = new Date(d);
    var dt2 = new Date();
    
    
    if (d == null) return "n/a";    
    
    return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) / (1000 * 60 * 60 * 24));
}

function pad(n) {
    return n < 10 ? "0" + n : n;
}

// Format date to: YYMMDD
function getSweDate(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var year = a.getFullYear();
    var month = a.getMonth() + 1;
    var date = a.getDate();

    if (UNIX_timestamp == null) return "n/a";

    var time = year.toString().substr(-2) + pad(month) + pad(date);

    return time;
}

export default class extends React.Component {
    constructor(props) {
        super(props);

        this.state = {stocks: [], error: ""};
    }

    componentDidMount() {
       this.fetchStocks();
    }

    fetchStocks() {
        var self = this;

        console.log("Hämtar aktiekurser...");

        var request = require("client-request");

        var options = {
            uri: "http://85.24.185.150:3000/stocks",
            method: "GET",
            json: true,
            headers: {
                "content-type": "application/json"
            }
        };

        var req = request(options, function(err, response, body) {
            if (!err) {
                self.setState({stocks: body});
            } else {
                self.setState({error: err});
                console.log(err);
            }
        });
    }

    getColor(percentage) {
        const green5 = {backgroundColor: "#00610e"};
        const green4 = {backgroundColor: "#3d860b"};
        const green3 = {backgroundColor: "#34a203"};
        const green2 = {backgroundColor: "#6ec007"};
        const green1 = {backgroundColor: "#c1d11f"};
        const red1 = {backgroundColor: "#ffb5b5"};
        const red2 = {backgroundColor: "#ff9393"};
        const red3 = {backgroundColor: "#ff6a6a"};
        const red4 = {backgroundColor: "#ff3e3e"};
        const red5 = {backgroundColor: "#ff2d2d"};

        var p = parseFloat(percentage);

        if (p > 20) return green5;

        if (p > 15) return green4;

        if (p > 10) return green3;

        if (p > 5) return green2;

        if (p > 0) return green1;

        if (p > -5) return red1;

        if (p > -10) return red2;

        if (p > -15) return red3;

        if (p > -20) return red4;
        
        else return red5;
    }
    
	getStopLossInfo(stock) {
		var stoplossTxt = "";
		
		switch (stock.stoplossTyp) {
			case config.stoplossType.StoplossTypeSMA20:
				stoplossTxt = stock.sma20 + ' (sma20)';
				break;
				
			case config.stoplossType.StoplossTypePercent:
				stoplossTxt = (stock.maxkurs - (stock.maxkurs * stock.stoplossProcent)).toFixed(2) + ' (' + (stock.stoplossProcent * 100).toFixed(2) + '%)';
				break;
				
			case config.stoplossType.StoplossTypeQuote:
				stoplossTxt = stock.stoplossKurs  + ' (fk)';
				break;

			case config.stoplossType.StoplossTypeATR:
				stoplossTxt = (stock.atrStoploss).toFixed(2) + ' (atr' + stock.ATRMultipel + '*' + stock.ATR + ')';
				break;
				
			default:
				stoplossTxt = 'Okänd stoploss';
		}
		
		return stoplossTxt;
		
	}
    
    renderStocks() {
        var self = this;
        var earningsDateDiff;

        var items = this.state.stocks.map(function(stock, index) {
            if (stock.antal > 0) {
				earningsDateDiff = dayDiffPosix(stock.earningsDate[0]);	            
                return (
                    <tr key={index}>
                        <td>
                            <Popover placement='bottom-start' >
                                <Popover.Target>
                                    <span >{stock.ticker}</span>
                                </Popover.Target>
                                <Popover.Header> 
                                    {stock.namn}
                                </Popover.Header>
                                <Popover.Body>
                                    {stock.sector}
                                </Popover.Body>
                            </Popover>                            
                        </td>
                        <td style={{textAlign: "right"}}>
                            {parseFloat(stock.senaste).toFixed(2)}
                            <span style={{color: "#b2b2b2"}}> ({parseFloat(stock.kurs).toFixed(2)})</span>
                        </td>
                        <td style={{textAlign: "right"}}>
                            {parseFloat(stock.utfall).toFixed(2)}
                            <span style={{color: "#b2b2b2"}}> ({parseFloat(((stock.maxkurs/stock.kurs)-1) * 100).toFixed(2)})</span>
                        </td>
                        <td>
							<BarChart width={130} height={30} margin={{top: 0, right: 0, left: 0, bottom: 0}} barGap={1} data={stock.spyProgress}>
								<Bar dataKey="value" fill='mediumseagreen' shape={<RenderBar/>}/>
								<Tooltip labelFormatter={(index) => (stock.spyProgress[index].name).slice(0, 10)} formatter={(value) => value.toFixed(2)+'%'}/>
							</BarChart>
                        </td>
                        {stock.sma20 != -1 ? (
                            <td style={self.getColor(parseFloat((1 - stock.sma20 / stock.senaste) * 100).toFixed(2))}>{}</td>
                        ) : (
                            <td style={{backgroundColor: "#f2f2a4"}}>{}</td>
                        )}
                        {stock.sma50 != -1 ? (
                            <td style={self.getColor(parseFloat((1 - stock.sma50 / stock.senaste) * 100).toFixed(2))}>{}</td>
                        ) : (
                            <td style={{backgroundColor: "#f2f2a4"}}>{}</td>
                        )}
                        {stock.sma200 != -1 ? (
                            <td style={self.getColor(parseFloat((1 - stock.sma200 / stock.senaste) * 100).toFixed(2))}>{}</td>
                        ) : (
                            <td style={{backgroundColor: "#f2f2a4"}}>{}</td>
                        )}
                        <td style={{textAlign: "right"}}>{self.getStopLossInfo(stock)}</td>   
                        {stock.larm == 1 ? (
                            <td>
                                <center>
                                    <span className='badge badge-danger'>Larm</span>
                                </center>
                            </td>
                        ) : (
	                        <td>
                            </td>
                        )}
                        <td>
                            <center>
                                <Button size="sm" className="btn btn-secondary" href={"#sell-stock/?id=" + stock.id + "&senaste=" + stock.senaste + "&antal=" + stock.antal}>
                                    Sälj
                                </Button>
                            </center>
                        </td>
                        <td>
                            <center>
                                <Button size="sm" className="btn btn-secondary" href={"#new-stock/?id=" + stock.id + "&senaste=" + stock.senaste}>
                                    Ändra
                                </Button>
                            </center>
                        </td>
                        {stock.utfall > 0 && dayDiff(stock.köpt_datum) > 0 ? (
                            <td style={{textAlign: "right"}}>
                                <span style={{color: "#b2b2b2"}}>
                                    <small>
                                        {((stock.utfall / dayDiff(stock.köpt_datum)) * 365).toFixed(0)}
                                        %, {dayDiff(stock.köpt_datum)}
                                        d, ({stock.utdelning != null ? Number(stock.utdelning).toFixed(2) : "n/a"})
                                    </small>
                                </span>
                            </td>
                        ) : (
                            <td style={{textAlign: "right"}}>
                                <span style={{color: "#b2b2b2"}}>
                                    <small>-, {dayDiff(stock.köpt_datum)}d, ({stock.utdelning != null ? Number(stock.utdelning).toFixed(2) : "n/a"})</small>
                                </span>
                            </td>
                        )}

                        {(earningsDateDiff == "n/a" || earningsDateDiff >= 5) ? (
							<td>{getSweDate(stock.earningsDate[0])}</td>
                        ) : earningsDateDiff < 0 ? (
							<td style={{color: "gray"}}>{getSweDate(stock.earningsDate[0])}</td>
                        ) : (
							<td style={{color: "red"}}>{getSweDate(stock.earningsDate[0])}</td>
                        )}
                    </tr>
                );
            }
        }); 

        var rates = this.state.stocks.map(function(stock, index) {
	        
	        if (stock.namn == "USD")
	        	config.rates.rateUSD = stock.senaste;
	        	
	        if (stock.namn == "CAD")
	        	config.rates.rateCAD = stock.senaste;
	        	
	        if (stock.namn == "EUR")
	        	config.rates.rateEUR = stock.senaste;
	        
            if (stock.antal == -1) {
                return (
                    <tr key={index}>
                        <td>{stock.namn}</td>
                        <td style={{textAlign: "right"}}>{parseFloat(stock.senaste).toFixed(2)}</td>
				<td style={{textAlign: "center"}}><Sparklines data={stock.quotes} width={130} height={25} svgWidth={130} svgHeight={30} margin={0}><SparklinesLine color="LightSkyBlue" /></Sparklines></td>
                        <td style={self.getColor(parseFloat((1 - stock.sma50 / stock.senaste) * 100).toFixed(2))}>{}</td>
                        <td style={self.getColor(parseFloat((1 - stock.sma200 / stock.senaste) * 100).toFixed(2))}>{}</td>
                    </tr>
                );
            }
        });

        if (items.length == 0) {
            if (this.state.error)
                var items = (
                    <tr>
                        <td colSpan="13">
                            <center>{"Kan inte nå servern: " + self.state.error.message}</center>
                        </td>
                    </tr>
                );
            else
                var items = (
                    <tr>
                        <td colSpan="13">
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
                            <th>Ticker</th>
                            <th style={{textAlign: "right"}}>Kurs</th>
                            <th style={{textAlign: "center"}}>% (max)</th>
                            <th style={{textAlign: "center"}}>vs SPY</th>
                            <th style={{textAlign: "center"}}>ma20</th>
                            <th style={{textAlign: "center"}}>ma50</th>
                            <th style={{textAlign: "center"}}>ma200</th>
                            <th style={{textAlign: "right"}}>S/L</th>
                            <th />
                            <th />
                            <th />
                            <th style={{textAlign: "right"}}>p/y, days, (yield)</th>
                            <th>Rapport</th>
                        </tr>
                    </thead>

                    <tbody>{items}</tbody> 
                </Table>

                <br />

                <Table striped={true} bordered={true} responsive={true}>
                    <thead>
                        <tr>
                            <th>Valuta</th>
                            <th style={{textAlign: "right"}}>Kurs</th>
                            <th style={{textAlign: "center"}}>Graf</th>
                            <th style={{textAlign: "center"}}>ma50</th>
                            <th style={{textAlign: "center"}}>ma200</th>
                        </tr>
                    </thead>

                    <tbody>{rates}</tbody>
                </Table>
            </div>
        );
    }

	xrender() {
		console.log('Rendering HEJ');
		return (
			<h1>
				HEJ
			</h1>
		);
	}
    render() {
        return (
            <div id="home">
                <Container fluid={true}>
                    <Container.Row>
                        <br/>
                    </Container.Row>
                    <Container.Row>
                        <Container.Col>
                            {this.renderStocks()}
                        </Container.Col>
                    </Container.Row>

                    <Container.Row>
						<Button margin={{left:1, right:1}} color="success" size="lg" href="#new-stock">
							Nytt köp
						</Button>

                        <span>{' '}</span>
                        <Button margin={{left:1, right:1}} className="btn-warning" size="lg" href="#meg">
                            Kandidater
                        </Button>
                        <span>{' '}</span>
                        <Button margin={{left:1, right:1}} className="btn-warning" size="lg" href="#evaluate">
                            Utvärdera
                        </Button>
                        <span>{' '}</span>
                        <Button margin={{left:1, right:1}} className="btn-danger" size="lg" href="#looker">
                            Leta
                        </Button>
                        <span>{'       '}</span>
                        <Button margin={{left:1, right:1}} className="btn-warning" size="lg" href="#candidates">
                            Bubbles
                        </Button>
                        
                    </Container.Row>
                </Container>
            </div>
        );
    }
};

