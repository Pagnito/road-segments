/* global fetch */
import React, {Component} from 'react';
import ReactMapGL from 'react-map-gl';
import ArcLayer from './components/arcLayer';
//import roads from './assets/pruned_extra_roads.json';
//import testerRoads from './assets/tester.json';
import wholeMap from './assets/i95_points.json';
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
  processData = (data) => { 
      if(data.connections){
        for(var key in data.connections){
            for(var id in data.connections[key]){
              data.connections[key][id] = data.connections[key][id].map(connectId =>{         
                return connectId.indexOf('.') > 0 ? connectId.replace('.','') : connectId
              })
            }         
            if(key.indexOf('.')>0){
                data.connections[key.replace('.','')] = data.connections[key];
                delete data.connections[key]; 
              }    
        }     
          //console.log(data.connections)
          this.setState({connections:data.connections})
      }
      
     data.features.forEach((road,ind) => {  
        road.properties.color='#afd36b'
        road.id = road.id.toString().indexOf('.') > 0 ? road.id.replace('.','') : road.id      
      // road.geometry.coordinates.map(coords=>{coords.reverse()})

        ///injecting connections obj into properties
        if(data.connections){
            Object.keys(data.connections).forEach(connection=>{
              if(road.id==connection){        
                road.properties.connections=data.connections[connection];
              }
            })   
        }       
      })
      //console.log(data.features)
      this.setState({i95Points:data.features})
   }
   componentDidMount(){ 
    this.processData(wholeMap)
              
    this.map = this.reactMap.getMap();
    this.map._interactive=true;
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
  handleGeoJSONUpload = (e) => {  
    
      const promise = new Promise ((resolve,reject)=>{
            let reader = new FileReader();
            reader.readAsText(e.target.files[0]);
            reader.onload = () => {                
                let geoJson = JSON.parse(reader.result);
              // console.log(JSON.parse(reader.result))            
                resolve(geoJson)              
            }
        })
      promise.then((geoJson)=>{
        let changeGeoJson = new Promise((resolve,reject)=>{
          console.log(geoJson);
          this.processData(geoJson);
          this.setState({i95Points:geoJson});
          resolve();
        })
          changeGeoJson.then(()=>{
            this.map.getSource('segments').setData(this.state.i95Points)
            this.map.getSource('connectionSegs').setData(this.state.i95Points)
            console.log( this.map.getSource('segments'))
           })
       })
   }

    set_connection_color(hover_id, cons, color, enable=true){
        if(cons !== undefined){
            cons.forEach(con_id => {
                if(hover_id === null || Number(con_id) !== hover_id){
                    this.map.setFeatureState({source: "connectionSegs", id: con_id},
                                             {connection: enable, color: color});
                }
            });
        }
    }


  hover=(info)=>{  
    var feature = this.map.queryRenderedFeatures([info.offsetCenter.x,info.offsetCenter.y],'segments');
    //console.log(feature[0])
      if(feature.length>0){
          var hoveredSegId = feature[0].id;       
          this.state.currAndPrev.push(feature[0]);
          this.setState({hoveredSeg:feature[0]});
            if (hoveredSegId) {          
                this.map.setFeatureState({source: 'segments', id: hoveredSegId}, { hover: true});
                if(feature[0].properties.connections){
                    var connections = JSON.parse(feature[0].properties.connections)
                          
                    this.set_connection_color(hoveredSegId, connections.continue, "light-blue");
                    this.set_connection_color(hoveredSegId, connections.merge, "red");
                    this.set_connection_color(hoveredSegId, connections.split, "yellow");
                    this.set_connection_color(hoveredSegId, connections.right, "blue");
                    this.set_connection_color(hoveredSegId, connections.left, "purple");
                 } 
              } 
            if(this.state.currAndPrev.length > 2){                       
                 var currAndPrev = this.state.currAndPrev.slice(-2);                  
                 this.setState({ currAndPrev: currAndPrev });    
                                 
                 if(this.state.currAndPrev[0].id !== this.state.currAndPrev[1].id){
                   this.map.setFeatureState({source: 'segments', id: this.state.currAndPrev[0].id}, { hover: false});
                    if(this.state.currAndPrev[0].properties.connections){
                          let connectionsObj1 = JSON.parse(this.state.currAndPrev[0].properties.connections)  
                          
                          this.set_connection_color(null, connectionsObj1.continue, "light-blue", false);
                          this.set_connection_color(null, connectionsObj1.merge, "red", false);
                          this.set_connection_color(null, connectionsObj1.split, "yellow", false);
                          this.set_connection_color(null, connectionsObj1.right, "blue", false);
                          this.set_connection_color(null, connectionsObj1.left, "purple", false);
                      }
                    }
                }    
          }
          
      if(feature.length==0){  
        if(Object.keys(this.state.hoveredSeg).length>0){ 
            if(this.state.currAndPrev[1]){
              this.map.setFeatureState({source: 'segments', id: this.state.currAndPrev[0].id}, { hover: false});
              if(this.state.currAndPrev[1].properties.connections){
                    var connectionsObj = JSON.parse(this.state.currAndPrev[1].properties.connections)  

                    this.set_connection_color(null, connectionsObj.continue, "light-blue", false);
                    this.set_connection_color(null, connectionsObj.merge, "red", false);
                    this.set_connection_color(null, connectionsObj.split, "yellow", false);
                    this.set_connection_color(null, connectionsObj.right, "blue", false);
                    this.set_connection_color(null, connectionsObj.left, "purple", false);
                }
              }       
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
        if(Object.keys(segment).length>0){
         //console.log(segment)
         function mapConnections(connections){
              return connections.map((connect, i)=>{
                let laneNum = connect.slice(-1)
                let id = connect.slice(0,connect.length-1)
                if(i==connections.length-1){              
                  return id + '.' + laneNum
                 }
                 return id + '.' + laneNum + ', '
               })
           }
           function renderConnections(){
             if(segment.properties.connections){
                  return (
                    <ul>
                      <li ><span id="continueToolTip">Continue:</span>{mapConnections(connectionsObjToolTip.continue || [])} </li>
                      <li ><span id="rightToolTip">Right:</span> {mapConnections(connectionsObjToolTip.right || [])} </li>
                      <li ><span id="leftToolTip">Left:</span>{mapConnections(connectionsObjToolTip.left || [])} </li>
                      <li ><span id="mergeToolTip">Merge:</span>{mapConnections(connectionsObjToolTip.merge || [])} </li>
                      <li ><span id="splitToolTip">Split:</span>{mapConnections(connectionsObjToolTip.split || [])} </li>
                    </ul>
                  )
                }
             }
          if(segment.properties.connections){
            var connectionsObjToolTip = JSON.parse(segment.properties.connections)
          }
            function returnId(id){
              let laneNum = id.slice(-1)
              let idNum = id.slice(0,id.length-1)
              return  idNum + '.' + laneNum
             }
             let id = segment.id.toString()
          return (
            <div style={{left: `0px`, bottom: `0px`}} className="toolTip">
              <div><span className="bold">Id:</span> {returnId(id)}</div>                   
              <div><span className="bold">Highway:</span> {segment.properties.highway}</div>
              <div><span className="bold">Hgv:</span> {segment.properties.hgv}</div>
              <div><span className="bold">Surface:</span> {segment.properties.surface}</div>
              <div><span className="bold">Condition:</span> {segment.properties.condition}</div>
              <div><span className="bold">Lanes:</span> {segment.properties.lanes}</div>
              <div><span className="bold">Width:</span> {segment.properties.width}</div>
              <div><span className="bold">Max Speed:</span> {segment.properties.maxspeed}</div>
              <div><span className="bold">Oneway:</span> {segment.properties.oneway}</div>
              <div><span className="bold">Connections:</span> 
                {renderConnections()}
              </div>
            </div>
          )          
        //}
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
          onMouseLeave={e=>console.log('hey')}
          mapboxApiAccessToken={MAPBOX_TOKEN}>
         
          {/*<ArcLayer
            testerRoads={this.state.testerRoads}
            onHover={this.onHover}
            viewport={this.state.viewport}
            //arcs={this.state.points} 
          segments={this.state.segments}/>*/}
     </ReactMapGL>
        <div id="controls">
        <div className="controlsTitleItem" >
           <input onChange={this.handleGeoJSONUpload} accept='json' type="file" name="file-input" id="file-input"></input>
           <label htmlFor="file-input">
            <i className="fas fa-upload"></i>
           </label>
            Upload Your GeoJson
         </div>
        </div>
        {this.renderToolTip(this.state.hoveredSeg)}
      </div>
    );
  }
}


export default App;
