/* global fetch */
import React, {Component} from 'react';
import MapGL from 'react-map-gl';
import ArcLayer from './components/arcLayer';
import {scaleQuantile} from 'd3-scale';
import deckGL from 'deck.gl';
import roads from './assets/pruned_extra_roads.json';
import testerRoads from './assets/tester.json';
import mapboxgl from 'mapbox-gl';
import './App.css';

const MAPBOX_TOKEN = "pk.eyJ1IjoicGFnbml0byIsImEiOiJjamxhMnY4a3UwNDVhM3BxaTV1NWM3ZGR6In0.pRhJryLN4D7NxD5ZbC1MbA";
class App extends Component {
  constructor(props){
    super(props)
    this.state={
      startingPoint: [-71.063,42.558],
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        //center:[-71.063,42.558],
        longitude: -71.063,
        latitude: 42.558,
        zoom:11,
        maxZoom: 21,
        pitch: 50,
        bearing: 50,
        interactive: true
        
      },
      hoveredItem:null,
      hoveredColor: [55, 229, 232,100]
    }
  }

   componentDidMount(){
    roads.features.forEach((road,ind) => {
      if(ind>5 && ind <1000){
        road.properties.color="#f48942"
      } else {
      road.properties.color='#afd36b'
      }
    })
  
    this.setState({data:roads.features})



                   
    this.map = this.reactMap.getMap();
    
     this.map.on('load', () => {
       //add the GeoJSON layer here
        console.log(this.map)
       this.map.addLayer({
            "id": "segments",
            "type": "line",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": this.state.data                   
                }
                    
            },
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-color": ['get','color'],
                "line-width": 5
            }
        })

       
  
       
      })
   
     this.map.on('mousemove', 'segments', (e)=>{
       var feature =this.map.queryRenderedFeatures(e.point);
      
      })


    ////////////////////////////////////////////////////////
    /*const linePoints = [];
    roads.features.forEach(road => {road.properties.color=[244, 187, 65, 200]})
    this.setState({segments:roads})
    roads.features.map((seg,ind1)=>{
      
      const segment = seg.geometry.coordinates;
      const segId = seg.id;
      
      segment.map((points,ind2) =>{
        if(ind2<segment.length-1){
         
         linePoints.push(
            {from:[points[0],points[1]], to:[segment[ind2+1][0],segment[ind2+1][1]], id:segId}
           )
          }
      })
      
    })
    this.setState({testerRoads:linePoints})
      console.log(linePoints)*/
   /* testerRoads.features.forEach(road => {road.properties.color=[244, 187, 65, 200]})
    this.setState({testerRoads:testerRoads})
    const testerPoints = []
    const testLines=testerRoads.features[3].geometry.coordinates;
    testLines.map((road,ind)=>{
      if(ind<testLines.length-1){
      testerPoints.push(
        {from:[road[0],road[1]], to:[testLines[ind+1][0],testLines[ind+1][1]], id:'gig'}
       )
      }
    })
    this.setState({testerRoads:testerPoints})*/
    //////////////////////////////////////////////////////////////////
   
    
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
  _onViewportChange(viewport){
    this.setState({
      viewport: {...this.state.viewport, ...viewport}
    });
  }
  onHover=(info)=> {
        
        this.setState({hoveredItem:info})
        if(info.picked){
        var segmentsClone = this.state.segments;
        var hoveredRoad = this.state.segments.features.map(road=>{   
          if(info.object.id===road.id){   
            console.log(road)
            road.properties.color = this.state.hoveredColor;
            
          }  else {
            road.properties.color = [244, 187, 65, 200];
          }
          return road 
        });
        segmentsClone.features = hoveredRoad
        this.setState({segments:segmentsClone})
      }
     
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

     <MapGL
      ref={(reactMap) => { this.reactMap = reactMap; }} 
          {...this.state.viewport}
          mapStyle="mapbox://styles/pagnito/cjluz0klc24v72sp7471bbxwq"
          onViewportChange={viewport => this._onViewportChange(viewport)}
         
          mapboxApiAccessToken={MAPBOX_TOKEN}>
          
          {/*<ArcLayer
            testerRoads={this.state.testerRoads}
            onHover={this.onHover}
            viewport={this.state.viewport}
            //arcs={this.state.points} 
          segments={this.state.segments}/>*/}
     </MapGL>
        
        {this.renderToolTip(this.state.hoveredItem)}
      </div>
    );
  }
}


export default App;
