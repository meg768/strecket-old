import React from 'react';
import StockChartList from './stock-chart-list.js';
import Request from 'yow/request';
import {Container, Table, Row, Col} from 'react-bootify';
import {Sparklines, SparklinesLine, SparklinesReferenceLine, SparklinesBars} from 'react-sparklines';

require('./meg.css');

var _descr1;



function pad(n) {
    return (n < 10) ? ("0" + n) : n; 
}


function sweDate(theDate) {
  var year = theDate.getFullYear();
  var month = theDate.getMonth()+1;
  var date = theDate.getDate();

  var time = year.toString() + '-' + pad(month) + '-' + pad(date);

  return time;
}

 
class NagotSomFunkarBattreOmNagotBlirFel extends React.Component {

	constructor(props) {
		super(props);

		this.state = {spikes:null, dates:null, error:null, sectors:[], tickers: "", mmth:"-", fearandgreed:"-"};
		
		this.handleCheck = this.handleCheck.bind(this);
		this.handleChange = this.handleChange.bind(this);		
		
	};

	getMMTH() {
        return new Promise((resolve, reject) => {
	        var request = new Request('http://85.24.185.150:3000');
	        var query = {};
	        
	        query.sql = 'SELECT truncate(count(*)/(select count(*) from stocks)*100, 0) as mmth FROM stockquotes INNER JOIN stocks ON stocks.symbol = stockquotes.symbol where stockquotes.date=? and stockquotes.close > stocks.sma200';

	        query.values = [this.state.dates[0]];

	        request.get('/mysql', {query:query}).then(response => {
                resolve(response.body[0].mmth);
	        })
	        .catch(error => {
                reject(error);
	        })
        });
		
	}	
	
	getSectors() {
        return new Promise((resolve, reject) => {
	        var request = new Request('http://85.24.185.150:3000');
	        var query = {};
	        var sectors = [];
	        
	        query.sql = 'SELECT stocks.industry, sum(b.close>a.close)/count(b.close) as perc FROM stockquotes a INNER JOIN stockquotes b ON a.symbol = b.symbol INNER JOIN stocks ON stocks.symbol = a.symbol where a.date=? and b.date=? and sector <> "" and industry <> "" group by sector, industry order by perc desc';

	        query.values = [this.state.dates[1], this.state.dates[0]];

	        request.get('/mysql', {query:query}).then(response => {
	            sectors = response.body;
                resolve(sectors);
	        })
	        .catch(error => {
                reject(error);
	        })
        });
		
	}

	getDates() {
        return new Promise((resolve, reject) => {
	        var request = new Request('http://85.24.185.150:3000');
	        var query = {};
	        var dates = [];

			// Räkna ut de två senaste datumen som har kurser och troligen inte är helg (dvs mer än 1000 rader)
	        query.sql = 'select distinct date from (SELECT COUNT(date) as c, date FROM stockquotes GROUP BY date HAVING c > 1000) tradeDays order by date desc limit 2';

	        request.get('/mysql', {query:query}).then(response => {

		        dates[0] = sweDate(new Date(response.body[0].date));
		        dates[1] = sweDate(new Date(response.body[1].date));

                resolve(dates);
	        })
	        .catch(error => {
                reject(error);
	        })
        });
	}

	getFearAndGreed() {
        return new Promise((resolve, reject) => {	
	        var request = require("client-request");
	
	        var options = {
	            uri: "http://85.24.185.150:3000/fearandgreed",
	            method: "GET",
	            json: true,
	            headers: {
	                "content-type": "application/json"
	            }
	        };
	
	        var req = request(options, function(err, response, body) {
	            if (!err) {
		            body.pop(); // Ta bort värdet för ett år sen
		            body.reverse(); // Äldst värde först
	                resolve(body);
	            } else {
	            	console.log("Err: getFearAndGreed:", err);
	                reject(err);
	            }
	        });
		});		
	}

	getSpikes() {  
        return new Promise((resolve, reject) => {
	        var request = new Request('http://85.24.185.150:3000');
	        var query = {};
	        var spikes = [];
	        
			_descr1 = "60% över normal volym, stängt över gårdagen, över 51 week high, över sma200, omsatt mer än 5 miljoner $";
	        query.sql    = 'SELECT a.symbol, a.volume, b.volume, a.close as lastClose, b.close as previousClose FROM stockquotes a INNER JOIN stockquotes b ON a.symbol = b.symbol INNER JOIN stocks ON stocks.symbol = a.symbol WHERE a.date = ? AND b.date = ? AND a.volume > b.AV14*1.6 AND a.close > b.close AND a.close > a.SMA200 AND a.close*a.AV14 > 5000000 AND a.close > a.open AND a.close >= stocks.wh51';

	        query.values = [this.state.dates[0], this.state.dates[1]];

	        request.get('/mysql', {query:query}).then(response => {
	            var tickers = response.body;
	            tickers.forEach(ticker => {
	                spikes.push(ticker.symbol);
	            });

                resolve(spikes);
	        })
	        .catch(error => {
                reject(error);
	        })
        });

	}
	
	componentDidMount() {

		//this.getFearAndGreed().then(numbers => {
			var numbers = [33,44,55,66];
			this.setState({fearandgreed:numbers});
			this.getDates().then(dates => {
		        this.setState({dates:dates});
				this.getMMTH().then(perc => {		   
			        this.setState({mmth:perc+"%"});					     
					this.getSectors().then(sectors => {
				        this.setState({sectors:sectors});
				        this.getSpikes().then(spikes => {
				            this.setState({spikes:spikes});
				        })
				        .catch(error => {
				            console.log(error);
				            this.setState({error:error});
				        });
				    })
			        .catch(error => {
			            console.log(error);
			            this.setState({error:error});
			        });
			    })
		        .catch(error => {
		            console.log(error);
		            this.setState({error:error});
		        });			        
		    })
	        .catch(error => {
	            console.log(error);
	            this.setState({error:error});
	        })
/*	    })
        .catch(error => {
            console.log(error);
            this.setState({error:error});
        })*/
    }
    
    getTopSectors() {
		this.state.sectors.sort(function(a, b){return a.perc>b.perc});	    
		
		return (
			<span><small>
			1. {this.state.sectors[0].industry}<br/>
			2. {this.state.sectors[1].industry}<br/>
			3. {this.state.sectors[2].industry}<br/>
			4. {this.state.sectors[3].industry}<br/>
			5. {this.state.sectors[4].industry}<br/>			
			</small></span>			
		);
    }
    
	handleCheck = (childData) => {		
		this.setState({tickers: this.state.tickers == "" ? childData : this.state.tickers + "\n" + childData});		
	}
	
	handleChange(event) {
		this.setState({tickers: event.target.value});
	}
	
	getGreedBalls() {
		var colors=[];
		var index;
		
		for (index = 0; index < this.state.fearandgreed.length; ++index) {
			if (this.state.fearandgreed[index] >= 50)
				colors[index] = "numberCircleGreen";
			else
				colors[index] = "numberCircleRed";				
		}
		
		return (
			<span>
			<span className={colors[0]}>{this.state.fearandgreed[0]}</span>
			<span className={colors[1]}>{this.state.fearandgreed[1]}</span>
			<span className={colors[2]}>{this.state.fearandgreed[2]}</span>
			<span className={colors[3]}>{this.state.fearandgreed[3]}</span>			
			</span>
		)
	}

    render() {
        if (this.state.spikes) {
	        
            var style = {};
            style.display = 'block';
            style.marginLeft = 'auto';
            style.marginRight = 'auto';
            style.resize = 'none';	  
            
			var styleContainer = {};
			styleContainer.borderColor = 'rgba(0, 0, 0, 0.1)';
			styleContainer.borderWidth = '1px';
			styleContainer.borderStyle = 'solid';
			styleContainer.lineHeight = '90%';

	        return (
		        <div>
		        <h1 className="text-center">{this.state.dates[1] + " - " + this.state.dates[0] + " (" + this.state.spikes.length + " st)"}</h1>
		        <h4 className="text-center">({_descr1})</h4>
		        <Container fluid={true}>
                    <Container.Row style={styleContainer}>
                    <Container.Col  style={{backgroundColor: "aliceblue"}}>
                    <small style={{color: "lightgray"}}>Sektorer i topp</small>
                    <br/>                    
		        	{this.getTopSectors()}
                    </Container.Col>
                    <Container.Col className="text-center" style={{backgroundColor: "aliceblue"}}>
                    <small style={{color: "lightgray"}}>Antal aktier över sma200</small>
                    <br/>
		        	<h1>{this.state.mmth}</h1>
                    </Container.Col>                    
                    <Container.Col className="text-center"  style={{backgroundColor: "aliceblue"}}>
                    <small style={{color: "lightgray"}}>Fear & Greed</small>
                    <br/><br/>
                    {this.getGreedBalls()}
                    </Container.Col>                    
                    </Container.Row>		        	
		        </Container>
                <StockChartList symbols={this.state.spikes} sectors={this.state.sectors} tickers={this.state.tickers} callback={this.handleCheck}/>
                <textarea style={style} name="candidates" rows="4" cols="100" placeholder="Kandidater" value={this.state.tickers} onChange={this.handleChange}></textarea>
                </div>
	        );
	    }
        else if (this.state.error) {
            // Försök visa felet på något sätt...
            return <div>{this.state.error.message}</div>
        }

        else {
            var image = require('../candidates/images/spinner.gif')
            var imgStyle = {};
            imgStyle.marginLeft = 'auto';
            imgStyle.marginRight = 'auto';
            imgStyle.display = 'block';
            return <div style={{position:'absolute', width:'100%',  height:'100%'}}><img style={imgStyle} src={image}></img></div>
        }
    }
}

export default NagotSomFunkarBattreOmNagotBlirFel;
