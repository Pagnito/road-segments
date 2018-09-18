/* global fetch */
import React, {Component} from 'react';
import ReactMapGL from 'react-map-gl';
import ArcLayer from './components/arcLayer';
import {scaleQuantile} from 'd3-scale';
import roads from './assets/pruned_extra_roads.json';
import testerRoads from './assets/tester.json';
import wholeMap from './assets/wholeMap.json';
import * as d3 from 'd3';
import './App.css';

const MAPBOX_TOKEN = "pk.eyJ1IjoicGFnbml0byIsImEiOiJjamxhMnY4a3UwNDVhM3BxaTV1NWM3ZGR6In0.pRhJryLN4D7NxD5ZbC1MbA";
class App extends Component {
  constructor(props){
    super(props)
    this.state={
      connections:[],
      hoveredSeg:{},
      currAndPrev:[],
      startingPoint: [-71.063,42.558],
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        //center:[-71.063,42.558],
        longitude: -71.063,
        latitude: 42.558,
        zoom:11,
        maxZoom: 20,
        pitch: 50,
        bearing: 50,     
      }     
    }
  }

   componentDidMount(){
     ///making the float part of the id because mapbox gl needs round numbers
     //this.map = this.reactMap.getMap();
       //const promise =  new Promise((resolve, reject)=>{
          //const error = false;
            for(var key in wholeMap.connections){
              for(var id in wholeMap.connections[key]){
                wholeMap.connections[key][id] = wholeMap.connections[key][id].map(connectId =>{         
                  return connectId.replace('.','')
                })
              }
              wholeMap.connections[key.replace('.','')] = wholeMap.connections[key];
              delete wholeMap.connections[key];  
            
            }     
            //console.log(wholeMap.connections)
            this.setState({connections:wholeMap.connections})
            
          wholeMap.map.features.forEach((road,ind) => {  
              road.properties.color='#afd36b'
              road.id = road.id.replace('.','')
              road.geometry.coordinates.map(coords=>{coords.reverse()})

              ///injecting connections obj into properties
              Object.keys(wholeMap.connections).forEach(connection=>{
                if(road.id==connection){        
                  road.properties.connections=wholeMap.connections[connection];
                }
              })          
            })
            //console.log(wholeMap.map)
            this.setState({i95Points:wholeMap.map.features})
          /*
            if(!error){
              resolve(wholeMap.map.features)
            } else {
              reject('Error: Something wong dummy')
            }
         })*/
       
   
  
    /*
    promise.then((data)=>{
      let canvas = this.map.getCanvasContainer()
     console.log(data)
      let path = d3.geoPath().projection(d3.geoAlbers())
      var svg = d3.select(canvas).append("svg")
      .attr('height',this.state.viewport.height)
      .attr('width',this.state.viewport.width)
      svg.selectAll('text').append('text').text('supfoo')
      svg.selectAll('path')
    .data(data)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('stroke-width', 10)
    .attr('stroke', '#fca820')
    })
        */          
    this.map = this.reactMap.getMap();
    this.map._interactive=true
    this.map.on('load', () => {
       //console.log(this.state.data)  
      this.map.addLayer({
            "id": "segments",
            "type": "line",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": this.state.i95Points
                 }
                    
             },
            "layout": {
                "line-join": "round",
                "line-cap": "round"
             },
            "paint": {
                //"line-color": ['get','color'],
                "line-width": 5,
                "line-color": ["case",
                ["boolean", ["feature-state", "hover"], false],
                 ['get','color'],
                 '#fca820'
                 ]                          
             }
        });  
        this.map.addLayer({
          "id": "connectionSegs",
          "type": "line",
          "source": {
              "type": "geojson",
              "data": {
                  "type": "FeatureCollection",
                  "features": this.state.i95Points
               }
                  
           },
          "layout": {
              "line-join": "round",
              "line-cap": "round"
           },
          "paint": {
              //"line-color": '#1dc6ad',
              "line-width": 5,
              "line-color": ["case",
              ["boolean", ["feature-state", "connection"], false],
              ['case', 
              ['==', ['feature-state', 'color'], 'light-blue'],'#42d1f4',
              ['==', ['feature-state', 'color'], 'blue'],'#0431e5',
              ['==', ['feature-state', 'color'], 'purple'],'#e038d7',
              ['==', ['feature-state', 'color'], 'red'],'#f72222',
              ['==', ['feature-state', 'color'], 'yellow'],'#f9f345',
              '#fff'],           
              'rgba(244, 232, 66, 0.0)'
              ]            
           }     
      })    
     })
    //////////////////////////////////////////////////////////////////
   
    ///fetching starbucks locations for initial arc layer study. to be deleted
    /* fetch('https://opendata.socrata.com/resource/txu4-fsic.json')
    .then(data=>data.json())
    .then(locations => {
      const points = []
       Object.keys(locations.map(location => {
         points.push(
           {from:this.state.startingPoint,to:[Number(location.longitude),Number(location.latitude)]}
          )
       }))
       this.setState({points:points})
    });*/
   
  }

  hover=(info)=>{
    
    var feature = this.map.queryRenderedFeatures([info.offsetCenter.x,info.offsetCenter.y],'segments');
    //console.log(feature[0])
      if(feature.length>0){
          var hoveredSegId = feature[0].id;       
          this.state.currAndPrev.push(hoveredSegId);
          this.setState({hoveredSeg:feature[0]});
            if (hoveredSegId) {          
                this.map.setFeatureState({source: 'segments', id: hoveredSegId}, { hover: true});
                var connections = JSON.parse(feature[0].properties.connections)
             
                if(connections.continue){              
                    connections.continue.forEach(connectionId=>{                   
                      if(Number(connectionId)!==hoveredSegId){
                        console.log(connectionId)
                        this.map.setFeatureState({source: 'connectionSegs', id: connectionId}, { connection: true,
                                                                                                 color:'light-blue'                 });
                        
                        //console.log(typeof connectionId)
                       }
                     })
                   }
                  if(connections.merge){              
                      connections.merge.forEach(connectionId=>{                   
                        if(Number(connectionId)!==hoveredSegId){
                          console.log(connectionId)
                          this.map.setFeatureState({source: 'connectionSegs', id: connectionId}, { connection: true,
                                                                                                  color:'red'                 });
                          
                          //console.log(typeof connectionId)
                        }
                      })
                   }
                  if(connections.split){              
                      connections.split.forEach(connectionId=>{                   
                        if(Number(connectionId)!==hoveredSegId){
                          console.log(connectionId)
                          this.map.setFeatureState({source: 'connectionSegs', id: connectionId}, { connection: true,
                                                                                                  color:'yellow'                 });
                          
                          //console.log(typeof connectionId)
                        }
                      })
                   }
                  if(connections.right){              
                      connections.right.forEach(connectionId=>{                   
                        if(Number(connectionId)!==hoveredSegId){
                          console.log(connectionId)
                          this.map.setFeatureState({source: 'connectionSegs', id: connectionId}, { connection: true,
                                                                                                  color:'blue'                 });
                          
                          //console.log(typeof connectionId)
                        }
                      })
                    }
                  if(connections.left){              
                      connections.left.forEach(connectionId=>{                   
                        if(Number(connectionId)!==hoveredSegId){
                          console.log(connectionId)
                          this.map.setFeatureState({source: 'connectionSegs', id: connectionId}, { connection: true,
                                                                                                  color:'purple'                 });
                          
                          //console.log(typeof connectionId)
                        }
                      })
                  }
                } 
              if(this.state.currAndPrev.length > 2){
              
                  var currAndPrev = this.state.currAndPrev.slice(-2)
                  this.setState({ currAndPrev: currAndPrev })
                  //console.log(currAndPrev)
                  if(this.state.currAndPrev[0] !== this.state.currAndPrev[1]){
                    this.map.setFeatureState({source: 'segments', id: this.state.currAndPrev[0]}, { hover: false});
                  }
              }   
          }
      if(feature.length==0){   
        if(Object.keys(this.state.hoveredSeg).length>0){         
          this.map.setFeatureState({source: 'segments', id: this.state.hoveredSeg.id}, { hover: false});
          this.setState({hoveredSeg:{}})
         } 
       }
  }


  /////////////////////////////////////////
  _onViewportChange(viewport){
      this.setState({
        viewport: {...this.state.viewport, ...viewport}
       });
    }
  

    renderToolTip=(segment)=>{
        if(segment){
          if(segment.picked){
          return (
            <div style={{left: `${segment.x}px`, top: `${segment.y}px`}} className="toolTip">
              <div><span className="bold">Longitude:</span> {segment.lngLat[0]}</div>
              <div><span className="bold">Latitude:</span> {segment.lngLat[1]}</div>
              <div><span className="bold">Id:</span> {segment.object.id}</div>
              <div><span className="bold">Name:</span> {segment.object.properties.name}</div>
              <div><span className="bold">Surface:</span> {segment.object.properties.surface}</div>
              <div><span className="bold">Condition:</span> {segment.object.properties.condition}</div>
              <div><span className="bold">Lanes:</span> {segment.object.properties.lanes}</div>
              <div><span className="bold">Width:</span> {segment.object.properties.width}</div>
            </div>
          )
          console.log(segment)
        }
      }
    }
  render() {
    return (
      <div className="App">

     <ReactMapGL
      ref={(reactMap) => { this.reactMap = reactMap }} 
          {...this.state.viewport}
          mapStyle="mapbox://styles/pagnito/cjluz0klc24v72sp7471bbxwq"
          onViewportChange={viewport => this._onViewportChange(viewport)}
          onHover={this.hover}
      
          mapboxApiAccessToken={MAPBOX_TOKEN}>
         
          {/*<ArcLayer
            testerRoads={this.state.testerRoads}
            onHover={this.onHover}
            viewport={this.state.viewport}
            //arcs={this.state.points} 
          segments={this.state.segments}/>*/}
     </ReactMapGL>
        
        {this.renderToolTip(this.state.hoveredItem)}
      </div>
    );
  }
}


export default App;
