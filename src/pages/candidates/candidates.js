import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMore from 'highcharts/highcharts-more';

if (typeof Highcharts === 'object')
	HighchartsMore(Highcharts);
else
	console.log("Highcharts är inte ett objekt");
	
	
require('./candidates.less');

const colRealEstate            = '#bbe1fa';
const colServices              = '#f0ece2';
const colTechnology            = '#a7d129';
const colUtilities             = '#ff8ba0';
const colFinancialServices     = '#f6e9e9';
const colFinancial             = '#ede68a';
const colEnergy                = '#a3f7bf';
const colBasicMaterials        = '#b9d2d2';
const colCommunicationServices = '#5fb9b0';
const colConsumerCyclical      = '#eeeeee';
const colConsumerDefensive     = '#77abb7';
const colHealthcare            = '#B88BF4';
const colIndustrials           = '#F2A365';


var series = [];
var _pointer = 1;


var options = {

	chart: {
        type: 'bubble',
        backgroundColor: '#121212',
        
        animation: {
	        duration: 2500,
	        easing: 'easeInOutQuint'	        
        }        
    },
    
    title: {
      text: '',
      style: {
      	color: 'white',
	  	fontWeight: 'bold',
	  	fontSize: 350,
	  	opacity: 0.09

      },
      align: 'center',
      verticalAlign: 'middle'
    },	         
    
    plotOptions: {
        bubble: {
            minSize: 20,
            maxSize: 90
        }
    },    
        
	// Hide stuff   
    legend: {
		enabled: false    
    },
    xAxis: {
		visible: false	
    },
    yAxis: {
		visible: false		
    },
    credits: {
        enabled: false
    },
    tooltip: {
        enabled: false
    },    
    // End hide

    series: [{
	    
        dataLabels: {
            enabled: true,
            format: '{point.id}',
            color: 'white',
			textOutline: '0px',
			allowOverlap: true,
            opacity: '10%',
			style: {
		   		fontSize: 9
			}            
        },
        
        animation: {
	        duration: 2500,
	        easing: 'easeInOutQuint'	        
        },
                
    }]
};

function setIntervalImmediately(func, interval) {
  func();
  return setInterval(func, interval);
}

export default class Home extends React.Component {
	
	getSectors() {
				
        return new Promise((resolve, reject) => {	
	        var request = require("client-request");
	
	        var options = {
	            uri: "http://85.24.185.150:3000/sectors",
	            method: "GET",
	            json: true,
	            headers: {
	                "content-type": "application/json"
	            }
	        };
	
	        var req = request(options, function(err, response, body) {
	            if (!err) {
	                resolve(body);
	            } else {
	            	console.log("Err: getSectors:", err);
	                reject(err);
	            }
	        });
		});		
		
	}	
	
    constructor(props) {
        super(props);
        
		this.state = {loadingFlag: true};
        
    }
    
	afterChartCreated(chart) {
        var self = this;
        		
		this.internalChart = chart;
				
        setIntervalImmediately(function () {
			var copyOfSeries;
			
			if (!self.state.loadingFlag) {
				        
				copyOfSeries = JSON.parse(JSON.stringify(series[_pointer][1]));
				
				var d = series[_pointer][0].date;
				
				self.internalChart.setTitle({text: d.substr(d.length - 2)}, { text: ''}, false);			

				self.internalChart.series[0].setData(copyOfSeries);
				
				++_pointer;
				
			  	if (_pointer >= series.length) {
				  	
			  		_pointer = 1;				  	
			  	}

			}
		  		
        }, 2500);
        
	}    

    componentDidMount() {
	    var self = this;
	    
        setIntervalImmediately(function () {
			self.getSectors().then(sectorData => {
				series = sectorData.reverse();
				console.log("series", series);
				self.setState({loadingFlag: false});			
		    })
	        .catch(error => {
	            console.log("ERR:getSectors", error);
	        })
				  		
        }, 1000 * 60 * 60 * 24);
	    
    }
    
    onCancel() {
        window.history.back();
    }

    renderGraphs() {
        
        return (
	        <div id="container">
	            <HighchartsReact containerProps={{ style: { height: "100%" } }} highcharts={Highcharts} options={options} callback={this.afterChartCreated}/>
	        </div>
        );
    }

    render() {
        var self = this;
        var image = require('../candidates/images/spinner.gif')
        var imgStyle = {marginLeft: 'auto', marginRight: 'auto', display: 'block'};
                
        if (this.state.loadingFlag)	    
		    return (<div style={{position:'absolute', width:'100%',  height:'100%'}}><img style={imgStyle} src={image}></img></div>);
	    else
	        return (
	            <div id="container">
					{this.renderGraphs()}
	            </div>
	        )	    
    }
};

