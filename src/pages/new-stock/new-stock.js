import React from "react";
import Request from "rest-request";
import {Form, Button, Container, Row, Col, Dropdown, Card, Tag, Pill, Alert} from 'react-bootify';

require("./new-stock.less");
var config = require('../config.js');


const _portfolioSize = 5000000;
const _maxBuyAmount = 400000;
const _risc = 0.25;
var _perc = 0.0;

var _ATR;
var _stockID;
var _stockQuote;
var _sma20 = 0;
var _maxkurs = 0;
var _xrate = config.rates.rateUSD;
var _fxTicker = ""; 

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


function pad(n) {
    return n < 10 ? "0" + n : n;
}


function getSweDate(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000); 
    var year = a.getFullYear();
    var month = a.getMonth() + 1;
    var date = a.getDate();

    if (UNIX_timestamp == null) return "n/a";

    var time = year.toString().substr(-2) + pad(month) + pad(date);

    return time;
}

function roundUp(num, precision) {
	num = parseFloat(num);
	if (!precision)
		return num.toLocaleString();
		
	return Math.ceil(num / precision) * precision;
}	


function unvalidDate(dString) {
	// dString -> YYYY-MM-DD
	
	if (dString.length != 10)
		return true;
		
	var day   = dString.substr(8, 2);
	var month = dString.substr(5, 2);
	var year  = dString.substr(0, 4);
	
	if (!isNumeric(day) || day < 1) 
    	return true;
    	
	if (!isNumeric(month) || (month < 1) || (month > 12)) 
    	return true;
    	
	if (!isNumeric(year) || (year < 1900) || (year > 2100))
		return true;

	var lastDayOfMonth = new Date(year, parseInt(month) + 1, -1).getDate();
		
	if (day > lastDayOfMonth)
		return true;
		
	return false;
}


export default class extends React.Component {
	
    constructor(props) {
        super(props);

		var query = new URLSearchParams(props.location.search);

		_stockID = query.get('id');
		_stockQuote = query.get('senaste');

		/*
        _stockID = props.location.query.id;
        _stockQuote = props.location.query.senaste; // Om vi editerar sparad aktie kommer senaste kurs här.
		*/
		
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleOptionChange = this.handleOptionChange.bind(this);
        
        this.state = {focus:'stockticker', helpATR: "", helpReport: "", helpPercentage: "", helpQuote: "", title: "Ange källa", selectedOption: "radioATR", sourceID: null, sources: [], inputs:{}, smaColor:"light", showAlert: false};
    }

	componentDidMount() {
		return;

        var self = this;
        var stoplossOption = "radioATR";
        var helpATR = "";
        var helpQuote = "";
        var sourceText;
        var request = require("client-request");

        var options = {
            uri: "http://85.24.185.150:3000/sources",
            method: "GET",
            json: true,
            headers: {
                "content-type": "application/json"
            }
        };

        var req = request(options, function(err, response, body) {
	    	if (!err) {
		    	var sources = [];
		    	var i;

		    	for (i = 0; i < body.length; i++) {
			    	sources.push(body[i]);
				}
				self.setState({sources: sources});

		        // Om vi har ett ID, hämta aktien
		        if (_stockID != undefined) {
		
		            options = {
		                uri: "http://85.24.185.150:3000/stock/" + _stockID,
		                method: "GET",
		                json: true,
		                headers: {
		                    "content-type": "application/json"
		                }
		            };
		
		            var req = request(options, function(err, response, body) {
		                if (!err) {
							self.state.inputs.stockticker  = body[0].ticker;  		
							self.state.inputs.stockname    = body[0].namn;  		                    
							self.state.inputs.stockprice   = body[0].kurs;
							self.state.inputs.stockcount   = body[0].antal;
							self.state.inputs.stockbuydate = (body[0].köpt_datum).substring(0, 10);							
							_maxkurs                       = body[0].maxkurs; 		
							_sma20                         = body[0].SMA20; 		
		
		                    if (body[0].stoplossTyp == config.stoplossType.StoplossTypeATR) {
								self.state.inputs.atrmultiple = body[0].ATRMultipel;
		                        stoplossOption = "radioATR";
								self.setPercentageHelp(body[0].ATRMultipel, stoplossOption);
		                    } else if (body[0].stoplossTyp == config.stoplossType.StoplossTypeQuote) {
								self.state.inputs.stoplossquote = body[0].stoplossKurs;
		                        stoplossOption = "radioQuote";
								self.setPercentageHelp(body[0].stoplossKurs, stoplossOption);		                        
		                    } else if (body[0].stoplossTyp == config.stoplossType.StoplossTypePercent) {
								self.state.inputs.stoplosspercentage = body[0].stoplossProcent * 100;
		                        stoplossOption = "radioPercent";
								self.setPercentageHelp(body[0].stoplossProcent, stoplossOption);		                        
		                    } else {
		                        stoplossOption = "radioSMA";			                    
								self.setPercentageHelp(_sma20, stoplossOption);		                        		                        
		                    }
		                    				
		                    helpATR = ((body[0].ATR / _stockQuote) * 100).toFixed(2) + "% (" + body[0].ATR.toFixed(2) + ")";
		                    helpQuote = _stockQuote;
							sourceText = sources.find(source => source.id === body[0].källa).text;
		                    self.setState({helpATR: helpATR, helpQuote: helpQuote, selectedOption: stoplossOption, sourceID: body[0].källa, title: sourceText});
		                } 
		                else
		                	console.log(err);
	            	});
		        } else {
		            self.setState({helptext: helpATR, selectedOption: stoplossOption});
		        }
		
            } 
            else
            	console.log(err);
	   	});
	   	
    }
    
    unvalidInput() {	    
        if (this.state.selectedOption == "radioATR") {
            if (!(this.state.inputs.atrmultiple != undefined && isNumeric(this.state.inputs.atrmultiple))) {
                return true;
            }
        } else if (this.state.selectedOption == "radioQuote") {
            if (!(this.state.inputs.stoplossquote != undefined && isNumeric(this.state.inputs.stoplossquote))) {
                return true;
            }
        } else if (this.state.selectedOption == "radioPercent") { 
        	if (!(this.state.inputs.stoplosspercentage != undefined && isNumeric(this.state.inputs.stoplosspercentage))) {
                return true;
            }
        }	    
	
		if (this.state.inputs.stockticker != undefined && this.state.inputs.stockticker.length == 0)
			return true;

		if (this.state.inputs.stockname != undefined && this.state.inputs.stockname.length == 0)
			return true;

		if (this.state.inputs.stockprice != undefined && this.state.inputs.stockprice.length == 0)
			return true;

		if (this.state.inputs.stockcount != undefined && this.state.inputs.stockcount.length == 0)
			return true;

		// Kolla datum
		if (this.state.inputs.stockbuydate == undefined)
			return true;
			
		if (unvalidDate(this.state.inputs.stockbuydate))
			return true;
	    
		// Dropdown vald
	    if (!isNumeric(this.state.sourceID))
	    	return true;
        	
        return false;
    }

    onSave() {
        var rec = {};
        var request = require("client-request");

        rec.ticker     = this.state.inputs.stockticker.toUpperCase();
        rec.namn       = this.state.inputs.stockname;
        rec.kurs       = this.state.inputs.stockprice;
        rec.maxkurs    = Math.max(this.state.inputs.stockprice, _maxkurs);
        rec.antal      = this.state.inputs.stockcount;
        rec.köpt_datum = (new Date(this.state.inputs.stockbuydate)).toISOString().substr(0, 10); // Dra ut YYYY-MM-DD
        rec.källa      = this.state.sourceID;

        if (this.state.selectedOption == "radioATR") {
            rec.stoplossTyp = config.stoplossType.StoplossTypeATR;
            rec.ATRMultipel = this.state.inputs.atrmultiple;
        } else if (this.state.selectedOption == "radioQuote") {
            rec.stoplossTyp = config.stoplossType.StoplossTypeQuote;
            rec.stoplossKurs = this.state.inputs.stoplossquote;
        } else if (this.state.selectedOption == "radioPercent") {
            rec.stoplossTyp = config.stoplossType.StoplossTypePercent;
            rec.stoplossProcent = this.state.inputs.stoplosspercentage/100;
        } else {
            rec.stoplossTyp = config.stoplossType.StoplossTypeSMA20;
        }

        rec.ATR = _ATR;
        rec.SMA20 = _sma20;

        var options = {
            uri: "http://85.24.185.150:3000/save",
            method: "POST",
            body: rec,
            timeout: 3000,
            json: true,
            headers: {
                "content-type": "application/json"
            }
        };

        var req = request(options, function callback(err, response, body) {
            if (err) {
                console.log(err);
            }

            window.history.back();
        });
    }

    onCancel() {
        window.history.back();
    }

	setPercentageHelp(val, option) {
		
		switch (option) {
			case "radioATR":
		        _perc = (((_stockQuote/(_stockQuote-val*_ATR))-1)*100).toFixed(2);
				break;

			case "radioQuote":
				_perc = (((_stockQuote/val)-1)*100).toFixed(2);
				break;

			case "radioPercent":
				_perc = val;
				break;
			
			case "radioSMA":
				if (_sma20 > _stockQuote)
					_perc = '-';
				else
					_perc = (((_stockQuote/_sma20)-1)*100).toFixed(2);
				break;

			default:
				console.log("Fel: setPercentageHelp: Okänd radioknapp");
		}
			    
	    this.setState({helpPercentage: _perc + "%"});
	}
    
    handleOptionChange(changeEvent) {
        this.setState({selectedOption: changeEvent.target.value});
        
        if (changeEvent.target.value == "radioATR")
			this.setPercentageHelp(this.state.inputs.atrmultiple, changeEvent.target.value);
        else if (changeEvent.target.value == "radioQuote")
			this.setPercentageHelp(this.state.inputs.stoplossquote, changeEvent.target.value);        
        else if (changeEvent.target.value == "radioPercent")
			this.setPercentageHelp(this.state.inputs.stoplosspercentage, changeEvent.target.value);
		else
			this.setPercentageHelp(null, changeEvent.target.value);		
    }
    
	onTextChange(event) {
        var inputs = this.state.inputs;

        // Säkerställ decimaltal '.' på pris, atr-multipel och stoploss
        if (event.target.id == 'stockprice' || event.target.id == 'atrmultiple' || event.target.id == 'stoplossquote' || event.target.id == 'stoplosspercentage') {
	        if (isNaN(event.target.value))
	        	event.target.value = event.target.value.slice(0, event.target.value.length-1);
        }

		// Säkerställ heltal på antal
        if (event.target.id == 'stockcount') {
	        if (isNaN(event.target.value) || event.target.value.slice(event.target.value.length-1, event.target.value.length) == '.')
	        	event.target.value = event.target.value.slice(0, event.target.value.length-1);
        }


        if (event.target.id == 'atrmultiple') {	        
	        if (!Number.isNaN(_stockQuote) && !Number.isNaN(event.target.value) && event.target.value != "" && !Number.isNaN(_ATR))
		        this.setPercentageHelp(event.target.value, 'radioATR');
	        else {
		        _perc = 0.0;
	            this.setState({helpPercentage: "n/a"});		        
	        }
        }
        
        if (event.target.id == 'stoplossquote') {	        
	        if (!Number.isNaN(_stockQuote) && !Number.isNaN(event.target.value) && event.target.value != "")
		        this.setPercentageHelp(event.target.value, 'radioQuote');		        
	        else {
		        _perc = 0.0;
	            this.setState({helpPercentage: "n/a"});		        
	        }
        }
        
        if (event.target.id == 'stoplosspercentage')
			this.setPercentageHelp(event.target.value, 'radioPercent');
                
        inputs[event.target.id] = event.target.value;
        this.setState({inputs:inputs});
    }

    handleKeyPress(target) {
        if (target.key == "Enter") {
            var self = this;

            var request = require("client-request");
            var ticker = target.currentTarget.value;

            var options = {
                uri: "http://85.24.185.150:3000/company/" + ticker,
                method: "GET",
                timeout: 1000,
                json: true,
                headers: {
                    "content-type": "application/json"
                }
            };

            var req = request(options, function(err, response, body) {
                if (!err) {
                    if (body != null) {
	                    if (body[0] != "getYahooQuote failed.") {		                    
							var inputs = self.state.inputs;
	                        var helpATR;
	                        var helpReport;
	                        var helpQuote;
	        
							inputs.stockname = body.price.shortName;
							
							if (body.price.currency == 'USD') {
								_xrate = config.rates.rateUSD;
								_fxTicker = " (USD)";								
							}
							else if (body.price.currency == 'CAD') {
								_xrate = config.rates.rateCAD;
								_fxTicker = " (CAD)";																
							}
							else if (body.price.currency == 'EUR') {
								_xrate = config.rates.rateEUR;
								_fxTicker = " (EUR)";	
							}
							else if (body.price.currency == 'SEK') {
								_xrate = 1;							
								_fxTicker = " (SEK)";									
							}
	
							console.log("handleKeyPress._xrate=", _xrate);
							
							self.setState({inputs:inputs});
	
	                        _ATR = body.misc.atr14;
							_stockQuote = (body.price.regularMarketPrice).toFixed(2);
							_sma20 = body.misc.sma20;
							
	                        helpQuote = _stockQuote;
	                        helpATR = ((_ATR/_stockQuote)*100).toFixed(2) + "% (" + _ATR + ")";
	                        helpReport = getSweDate(body.calendarEvents.earnings.earningsDate[0]);
	                        
							self.setState({smaColor: _stockQuote > _sma20 ? "success" : "danger"});
								
	                        self.setState({helpATR: helpATR, helpReport: helpReport, helpQuote: helpQuote, focus:'stockprice'});
                        }
                        else {
	                    	self.setState({showAlert: true});
                        }
                    }
                }
            });
        }
    }
    
    setID(source) {
	    this.setState({title:source.text, sourceID:source.id});
    }
    
    renderSources() {
		var self = this;

		var items = this.state.sources.map(function(source) {			
			return (
                <Dropdown.Item key={source.id} onClick={self.setID.bind(self, source)}>
                    {source.text}
                </Dropdown.Item>
            );
        }); 
        
        return items;
    }
    
    getBuyAmount() {
	    var amountTxt = '-';
	    
	    if (_perc > 0) {
		    var amount = _risc*_portfolioSize / Math.abs(_perc);
		    
		    if (amount > _maxBuyAmount)
		    	amountTxt = _maxBuyAmount.toLocaleString();
		    else {
			    amount = Math.trunc(Math.round(1000*amount) / 1000);
		    	amountTxt = amount.toLocaleString();
		    }
	    }
	    	
	    return amountTxt;
    }
    
    getRate () {	
	    var rate = _xrate;
console.log("getRate._xrate=", _xrate);	    
	    if (_xrate == 1)
	    	rate = "";
	    else
	    	rate = rate.toFixed(2);
	    	    
	    return rate + _fxTicker;
    }
    	    
    getBuyNumber() {
	    var countTxt = '-';
	    
	    if (_perc > 0) {
		    var amount = Math.min(_risc*_portfolioSize/Math.abs(_perc), _maxBuyAmount);
		    var count = Math.trunc((amount/_xrate)/_stockQuote);
		    
		    if (count < 100)
		    	count = count;
		    else if (count < 1000)
		    	count = roundUp(count, 10);
		    else if (count < 10000)
		    	count = roundUp(count, 100);
		    else if (count < 100000)
		    	count = roundUp(count, 1000);
		    else if (count < 1000000)
		    	count = roundUp(count, 10000);
		    else
		    	count = roundUp(count, 100000);
		    
		    countTxt = count.toLocaleString();		    
	    }

	    return countTxt;		    
    }    
    
	dismissAlert() {
		this.setState({showAlert:!this.state.showAlert});
	}    

	render() {
        return (
            <div id="new_stock">
                <Container>
                    <Form >
                        <Form.Group row>
                            <Form.Col sm={{offset:1}}>
                                <Form.Label tag='h2'>
                                    Ny aktie
                                </Form.Label>
                            </Form.Col>
                        </Form.Group>
                        <Form.Group row>
                            <Form.Col sm={1} textAlign='right' >
                                <Form.Label inline textColor='muted'>
                                    <small>Ticker</small>
                                </Form.Label>
                            </Form.Col>
                            <Form.Col sm={11}>
                                <Form.Input autoFocus={this.state.focus=='stockticker'} disabled={_stockID != undefined} value={this.state.inputs.stockticker} padding={{bottom:1}} type="text" id="stockticker" placeholder="Kortnamn för aktien" onChange={this.onTextChange.bind(this)} onKeyPress={this.handleKeyPress.bind(this)}/>
							    <Alert show={this.state.showAlert} dismiss={this.dismissAlert.bind(this)} color='warning'>
							        Hittar inte denna ticker.
							    </Alert>                                                            
                            </Form.Col>
                        </Form.Group>
                        <Form.Group row>
                            <Form.Col sm={1} textAlign='right' >
                                <Form.Label inline textColor='muted'>
                                    <small>Namn</small>
                                </Form.Label>
                            </Form.Col>
                            <Form.Col sm={11}>
                                <Form.Input value={this.state.inputs.stockname} padding={{bottom:1}} type="text" id="stockname" placeholder="Namnet på aktien" onChange={this.onTextChange.bind(this)}/>
                            </Form.Col>
                        </Form.Group>

                        <Form.Group row>
                            <Form.Col sm={1} textAlign='right' >
                                <Form.Label inline textColor='muted'>
                                    <small>Kurs</small>
                                </Form.Label>
                            </Form.Col>
                            <Form.Col sm={11}>
                                <Form.Input autoFocus={this.state.focus=='stockprice'} value={this.state.inputs.stockprice} padding={{bottom:1}} type="text" id="stockprice" placeholder="Köpt till kursen?"  onChange={this.onTextChange.bind(this)}/>
                            </Form.Col>
                        </Form.Group>

                        <Form.Group row>
                            <Form.Col sm={1} textAlign='right' >
                                <Form.Label inline textColor='muted'>
                                    <small>Antal</small>
                                </Form.Label>
                            </Form.Col>
                            <Form.Col sm={11}>
                                <Form.Input value={this.state.inputs.stockcount} padding={{bottom:1}} type="text" id="stockcount" placeholder="Antal aktier"  onChange={this.onTextChange.bind(this)}/>
                            </Form.Col>
                        </Form.Group>

                        <Form.Group row>
                            <Form.Col sm={1} textAlign='right' >
                                <Form.Label inline textColor='muted'>
                                    <small>Datum</small>
                                </Form.Label>
                            </Form.Col>
                            <Form.Col sm={11}>
                                 <Form.Input value={this.state.inputs.stockbuydate} padding={{bottom:1}} type="text" id="stockbuydate" placeholder="Datum för köp" onChange={this.onTextChange.bind(this)}/>
                            </Form.Col>
                        </Form.Group>


                        <Form.Group row>
                        
	                        <Form.Col sm={1} textAlign='right' >
	                            <Form.Label inline textColor='muted'>  
	                                <small>
	                                    Källa
	                                </small>
	                            </Form.Label>
	                        </Form.Col>
	                        <Form.Col sm={11}>
	                            <Dropdown placement='bottom-start'>
	                                <Dropdown.Target>
	                                    <Button outline color='secondary'>
	                                        {this.state.title == undefined ? 'Välj källa' : this.state.title}
	                                    </Button>
	                                </Dropdown.Target>
	                                <Dropdown.Menu >
										{this.renderSources()}
	                                </Dropdown.Menu>
	                            </Dropdown>
	                        </Form.Col>                        

                        </Form.Group>

	                    <Form.Group>
	                        <Form.Row>
	                            <Form.Group xs={12} sm={12} md={6}>
	                                <Card>
								        <Card.Header>
											Stop Loss
								        </Card.Header>                                
	                                    <Card.Body>
	                                    
										<Form inline padding={{vertical:1}}>                                    	
		                                    <Form.Radio value="radioATR" checked={this.state.selectedOption === "radioATR"} onChange={this.handleOptionChange}>
		                                        Släpande
		                                    </Form.Radio>
		
		                                    <Form.Input value={this.state.inputs.atrmultiple} margin={{left:2, right:2}} type="text" ref="atrmultiple" id="atrmultiple" placeholder="x ATR?" onChange={this.onTextChange.bind(this)}/>
		                                </Form>
	
										<Form inline padding={{vertical:1}}>                                    	
		                                    <Form.Radio value="radioQuote" checked={this.state.selectedOption === "radioQuote"} onChange={this.handleOptionChange}>
		                                        Under kurs
		                                    </Form.Radio>
		
		                                    <Form.Input value={this.state.inputs.stoplossquote} margin={{bottom:0, left:2, right:2}} type="text" ref="stoplossquote" id="stoplossquote" placeholder="Kurs?" onChange={this.onTextChange.bind(this)}/>
		                                </Form>
		                                                                
										<Form inline padding={{vertical:1}}>                                    	
		                                    <Form.Radio value="radioPercent" checked={this.state.selectedOption === "radioPercent"} onChange={this.handleOptionChange}>
		                                        Släpande under procent
		                                    </Form.Radio>
		                                    <Form.Input  value={this.state.inputs.stoplosspercentage} margin={{left:2, right:2}} type="text" ref="stoplosspercentage" id="stoplosspercentage" placeholder="%" onChange={this.onTextChange.bind(this)}/>
										</Form>

										<Form inline padding={{vertical:1}}>                                    	
		                                    <Form.Radio value="radioSMA" checked={this.state.selectedOption === "radioSMA"} onChange={this.handleOptionChange}>
		                                        Släpande under SMA20
		                                    </Form.Radio>
		                                    <span className={_stockQuote > _sma20 ? 'badge badge-success' : 'badge badge-danger'} style={{margin: '4px 4px'}}>{_sma20 == 0 ? '-' : _sma20}</span>
										</Form>
										
	                                    </Card.Body>
	                                </Card>
	                            </Form.Group>
	                            <Form.Group xs={12} sm={12} md={6}>
	                                <Card>
										<Card.Header>
										Info
										</Card.Header>
	                                    <Card.Body>
											<Container>
										        <Container.Row>
										            <Container.Col text="info text-right font-weight-light">Kurs nu</Container.Col>
										            <Container.Col>{this.state.helpQuote}</Container.Col>
										            <Container.Col text="info text-right font-weight-light">Rapport</Container.Col>
										            <Container.Col text="float-left">{this.state.helpReport}</Container.Col>										            
										        </Container.Row>
										        <Container.Row>
										            <Container.Col text="info text-right font-weight-light">ATR</Container.Col>
										            <Container.Col>{this.state.helpATR}</Container.Col>
										            <Container.Col text="info text-right font-weight-light">Risk</Container.Col>
										            <Container.Col>{this.state.helpPercentage > 0 ? "-" + this.state.helpPercentage : this.state.helpPercentage}</Container.Col>							
										        </Container.Row>
										        <Container.Row>
										            <Container.Col text="info text-right font-weight-light">Köpesumma</Container.Col>
										            <Container.Col>{this.getBuyAmount()}</Container.Col>
										            <Container.Col text="info text-right font-weight-light">Antal</Container.Col>
										            <Container.Col>{this.getBuyNumber()}</Container.Col>										            
										        </Container.Row>
										        <Container.Row>
										            <Container.Col text="info text-right font-weight-light"><small>Valuta</small></Container.Col>
										            <Container.Col><small>{this.getRate()}</small></Container.Col>
										            <Container.Col text="info text-right font-weight-light"></Container.Col>
										            <Container.Col></Container.Col>										            
										        </Container.Row>
										        
										    </Container>	                                    
	                                    </Card.Body>
	                                </Card>
	                            </Form.Group>
	                        </Form.Row>
	                    </Form.Group>

                        <Form.Group row>
                        
                            <Form.Col sm={1}>
                            
                            </Form.Col>
                            
                            <Form.Col sm={11}>
                                <Button color='success' outline onClick={this.onCancel.bind(this)}>
                                    Avbryt
                                </Button>
                                <span>{' '}</span>
                                <Button color="success" onClick={this.onSave.bind(this)} disabled={this.unvalidInput()}>
                                    Spara
                                </Button>
                            
                            </Form.Col>
    
                        </Form.Group>                        
                                                
                    </Form>
                </Container>
            </div>
        );
    }
};