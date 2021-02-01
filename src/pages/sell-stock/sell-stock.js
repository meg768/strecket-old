import React from "react";
import Request from "rest-request";

import {Form, Button, Container, Row, Col, Dropdown} from 'react-bootify';

require("./sell-stock.less");

const ReactDOM = require("react-dom");

var _stockID; 
var _stockQuote;
var _stockAmount;

function pad(n) {
    return n < 10 ? "0" + n : n;
}

function getSweDate(a) {
    var year = a.getFullYear();
    var month = a.getMonth() + 1;
    var date = a.getDate();

    var time = year.toString() + "-" + pad(month) + "-" + pad(date);

    return time;
}

export default class Home extends React.Component {
	
    constructor(props) {
        super(props);
        
		var query = new URLSearchParams(props.location.search);

		_stockID = query.get('id');
		_stockQuote = query.get('senaste');
        _stockAmount = query.get('antal');
        
        this.url = "http://85.24.185.150:3000";
        this.api = new Request(this.url);
        
        this.state = {};
    }

	componentDidMount() {
        var self = this;
        var defaultDate = new Date();        
        
	   	
		ReactDOM.findDOMNode(self.refs.sellprice).value = _stockQuote;
		ReactDOM.findDOMNode(self.refs.selldate).value = getSweDate(defaultDate);
		ReactDOM.findDOMNode(self.refs.sellamount).value = _stockAmount;
		
		ReactDOM.findDOMNode(self.refs.sellprice).focus();
	   	
    }

    onSave(id, date, amount) {
        var self = this;
	    
        var request = require("client-request");

		var date   = ReactDOM.findDOMNode(self.refs.selldate).value;
		var price  = ReactDOM.findDOMNode(self.refs.sellprice).value;
		var amount = ReactDOM.findDOMNode(self.refs.sellamount).value;

        var options = {
            uri: "http://85.24.185.150:3000/stocks/" + _stockID + "/date/" + date + "/price/" + price + "/amount/" + amount,
            method: "DELETE",
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

    handleKeyDown(target) {
        // Tillåt inte ','
        if (target.keyCode == 188) target.preventDefault();
    }

    render() {
        return (
            <div id="sell_stock">
                <Container>
                    <Form >
                        <Form.Group row>
                            <Form.Col sm={{offset:1}}>
                                <Form.Label tag='h2'>
                                    Sälj aktie
                                </Form.Label>
                            </Form.Col>
                        </Form.Group>

                        <Form.Group row>
                            <Form.Col sm={1} textAlign='right' >
                                <Form.Label inline textColor='muted'>
                                    <small>Datum</small>
                                </Form.Label>
                            </Form.Col>
                            <Form.Col sm={11}>
                                <Form.Input padding={{bottom:1}} type="text" ref="selldate"/>
                            </Form.Col>
                        </Form.Group>
                        
                        <Form.Group row>
                            <Form.Col sm={1} textAlign='right' >
                                <Form.Label inline textColor='muted'>
                                    <small>Pris</small>
                                </Form.Label>
                            </Form.Col> 
                            <Form.Col sm={11}>
                                <Form.Input padding={{bottom:1}} id="price" type="text" ref="sellprice" onKeyDown={this.handleKeyDown} />
                            </Form.Col>
                        </Form.Group>

                        <Form.Group row>
                            <Form.Col sm={1} textAlign='right' >
                                <Form.Label inline textColor='muted'>
                                    <small>Sålt antal</small>
                                </Form.Label>
                            </Form.Col>
                            <Form.Col sm={11}>
                                <Form.Input padding={{bottom:1}} type="text" ref="sellamount"/>
                            </Form.Col>
                        </Form.Group>

                        <Form.Group row>
                            <Form.Col sm={1}>
                                
                            </Form.Col>
                            <Form.Col sm={11}>
                                <Button color='success' outline onClick={this.onCancel.bind(this)}>
                                    Avbryt
                                </Button>
                                <span>{' '}</span>
                                <Button color="success" onClick={this.onSave.bind(this)}>
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

