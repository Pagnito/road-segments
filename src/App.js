/* global fetch */
import React, {Component} from 'react';
import ReactMapGL from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import ArcLayer from './components/arcLayer';
import io from 'socket.io-client';
//import roads from './assets/pruned_extra_roads.json';
//import testerRoads from './assets/tester.json';
import wholeMap from './assets/i95_points.json';
import './App.css';

const MAPBOX_TOKEN = "pk.eyJ1IjoicGFnbml0byIsImEiOiJjamxhMnY4a3UwNDVhM3BxaTV1NWM3ZGR6In0.pRhJryLN4D7NxD5ZbC1MbA";
class App extends Component {
  constructor(props){
    super(props)
    this.state={
      localMapConnects:[],
      flipped: false,
      flippedText: 'Show Local Map',
      findSegId:'',
      navVisible:false,
      connections:[],
      hoveredSeg:{},
      selectedSeg: {},
      selectedSegToolTip: {},
      currAndPrev:[],
      currAndPrevForClick:[],
      startingPoint: [-71.063,42.558],
      featureObjFromArr:{},
      egoPoints: {},
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
    ////below vars are not in state because its not async this way
    this.socketIdsArr = [];
    this.egoCounter = 0;
    this.car = {};
    this.socket = io.connect('http://localhost:3000/');
    this.socket.on('connect', ()=>{
      this.socket.on('pretendData', (data)=>{
        console.log(data)
      })
      this.socket.on('firstPoint', (firstPoint)=>{
        this._onViewportChange({
          longitude: firstPoint[0],
          latitude: firstPoint[1],
          zoom:15
        })
            this.map.addLayer({
              "id": "trace",
              "type": "line",
              "source": { 
                "lineMetrics": true,
                "type": 'geojson',
                "data": this.state.egoPoints
                },
              "paint": {
                  "line-color": "red",
                  'line-gradient': [
                      'interpolate',
                      ['linear'],
                      ['line-progress'],
                      0, "blue",
                      0.1, "royalblue",
                      0.3, "cyan",
                      0.5, "lime",
                      0.7, "yellow",
                      1, "red"
                  ],
                  //"line-opacity": 0.75,
                  "line-width": 4
              }
          });  
          this.carIcon = document.createElement('div');
          this.carIcon.classList.add('carIcon');
         
           //carIcon.style.backgroundImage = 'url(/assets/car-icon-deckgl.png)';
           this.carIcon.style.className = 'carIcon';
           this.carIcon.style.backgroundSize = "cover";

        this.car = new mapboxgl.Marker(this.carIcon)
        .setLngLat(firstPoint)
        .addTo(this.map);
        
         
       })
      this.socket.on('sendingPoint', (point) => {
        this.egoCounter+=1;
        this.socketIdsArr.push(point[0].id);
          if(this.egoCounter==1){
            if(point[0].properties.connections){
              let connections = point[0].properties.connections;

              this.set_click_connection_color("clickConnections", point[0].id, connections.continue, "light-blue");
              this.set_click_connection_color("clickConnections", point[0].id, connections.merge, "red");
              this.set_click_connection_color("clickConnections", point[0].id, connections.split, "yellow");
              this.set_click_connection_color("clickConnections", point[0].id, connections.right, "blue");
              this.set_click_connection_color("clickConnections", point[0].id, connections.left, "purple");
              this.map.setFeatureState({source: 'clickConnections', id: point[0].id}, { selectedConnections: true,
                                                                                        color: 'green' })
            } 
          }
        if(this.egoCounter>1){
          if(point[0].id!==point[1].id){
            if(point[1]){
              if(point[1].properties.connections){
                let prevConnections = point[1].properties.connections;
               this.set_click_connection_color("clickConnections", null, prevConnections.continue, "light-blue", false);
               this.set_click_connection_color("clickConnections", null, prevConnections.merge, "red", false);
               this.set_click_connection_color("clickConnections", null, prevConnections.split, "yellow", false);
               this.set_click_connection_color("clickConnections", null, prevConnections.right, "blue", false);
               this.set_click_connection_color("clickConnections", null, prevConnections.left, "purple", false);
               this.map.setFeatureState({source: 'clickConnections', id: point[1].id}, { selectedConnections: false,
                color: 'green' })
              }
            }
              if(point[0].properties.connections){
                let connections = point[0].properties.connections;
                
                this.set_click_connection_color("clickConnections", point[0].id, connections.continue, "light-blue");
                this.set_click_connection_color("clickConnections", point[0].id, connections.merge, "red");
                this.set_click_connection_color("clickConnections", point[0].id, connections.split, "yellow");
                this.set_click_connection_color("clickConnections", point[0].id, connections.right, "blue");
                this.set_click_connection_color("clickConnections", point[0].id, connections.left, "purple");
                this.map.setFeatureState({source: 'clickConnections', id: point[0].id}, { selectedConnections: true,
                  color: 'green' })
               } 
               
            }
         }   
          this.car.setLngLat(point[0].geometry.coordinates[0]);

          let promise = new Promise((resolve,reject)=>{
          let coords = this.state.egoPoints.features[0].geometry.coordinates;
          let withNewPoint = JSON.parse(JSON.stringify(this.state.egoPoints));
          coords.push(point[0].geometry.coordinates[0]);
          withNewPoint.features[0].geometry.coordinates = coords;
          this.setState({egoPoints:withNewPoint});         
          resolve();
          });
          promise.then(()=>{
            this.map.getSource('trace').setData(this.state.egoPoints);
            this._onViewportChange({
              longitude: point[0].geometry.coordinates[0][0],
              latitude: point[0].geometry.coordinates[0][1],
              
            })
            
          })
          
      })
    })
    
  }
/////end of constructor////////////

  pullOutOrInNav=()=>{
    var navBtn = document.getElementById('navBtn');
    if(this.state.navVisible){
      navBtn.setAttribute('style', 'display:block;')
      document.getElementById('controls').classList.remove('pullOut');   
      document.getElementById('controls').classList.add('pullIn');
      this.setState({navVisible:false})
    } else {
      navBtn.setAttribute('style', 'display:none;')
      document.getElementById('controls').classList.remove('pullIn');
      document.getElementById('controls').classList.add('pullOut');
      this.setState({navVisible:true})
    }
  }
  processData = (data) => { 
    ///create segment div points///dots between segments on map////
      const segmentDivPoints = data.features.map((feature,ind) =>{
        return {
          "type": "Feature",
           "geometry": {
              "type": "Point",
              "coordinates": feature.geometry.coordinates[0]
             }
         } 
      });
      const segmentDivPointsObj = {
        "type": "FeatureCollection",
        "features": segmentDivPoints
      }
 
      this.setState({segmentDivPoints: segmentDivPointsObj});

      ///////////////change connections id floats to whole numbers for mapbox to work////////
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
       if(ind%2===0){
        road.properties.color='#e28809'
       } else {
        road.properties.color='#633a00'
       }
        road.id = road.id.toString().indexOf('.') > 0 ? road.id.replace('.','') : road.id      
      // road.geometry.coordinates.map(coords=>{coords.reverse()})

        ///injecting connections obj into properties
        if(data.connections){
            Object.keys(data.connections).forEach(connection=>{
              if(road.id===connection){        
                road.properties.connections=data.connections[connection];
              }
            })   
        }       
      })
      //console.log(data.features)
      this.setState({i95Points:data.features});
      /////create a copy of features within in an object with ids as keys for quick queries/////
      let featureObjFromArr = {};
      data.features.map(feature => {
        let featureId = feature.id.toString().indexOf('.') > 0 ? feature.id.replace('.','') : feature.id; 
        featureObjFromArr[featureId] = feature;
        return feature;
       })
       this.setState({featureObjFromArr});
   }
   componentDidMount(){ 
    this.processData(wholeMap);
    window.addEventListener('resize', this._resize);
    this._resize();          
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
                    "line-join": "miter",
                    "line-cap": "butt"
                },
                "paint": {
                    //"line-color": ['get','color'],
                    "line-width": 5,
                    "line-color": ["case",
                    ["boolean", ["feature-state", "hover"], false],
                    '#afd36b',
                    ['get','color']                 
                    ]                          
                }
            });             
          this.map.addLayer({
            "id": "clickConnections",
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
                "line-cap": "butt"
            },
            "paint": {
                //"line-color": '#1dc6ad',
                "line-width": 5,
                "line-color": ["case",
                ["boolean", ["feature-state", "selectedConnections"], false],
                ['case', 
                ['==', ['feature-state', 'color'], 'light-blue'],'#42d1f4',
                ['==', ['feature-state', 'color'], 'blue'],'#0431e5',
                ['==', ['feature-state', 'color'], 'purple'],'#e038d7',
                ['==', ['feature-state', 'color'], 'red'],'#f72222',
                ['==', ['feature-state', 'color'], 'yellow'],'#f9f345',
                ['==', ['feature-state', 'color'], 'green'],"#afd36b",
                '#fff'],           
                'rgba(244, 232, 66, 0.0)'
                ]            
            }     
        }) 
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
                "line-cap": "butt"
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
        });
        this.map.addLayer({
          "id": "segmentDivPoints",
          "source": {
            "type": "geojson",
            "data": this.state.segmentDivPoints
           },
          "type": "circle",
          "paint": {
              "circle-radius": {
                'base': 1.75,
                'stops': [[12, 2], [22, 30]]
            },
              "circle-color": "black"
              }
      });
     })   
   }
    
  componentWillUnmount() {
    window.removeEventListener('resize', this._resize);
    this.socket.disconnect();
  }
  onChange=(e)=>{
    this.setState({[e.target.name]:e.target.value})
    
  }

  queryFeatures=(id)=>{
    let i=0;
    var featuresArr = [];
    if(id!==''){
        for(var key in this.state.featureObjFromArr){
          if(key.includes(id)){
            //console.log('yes')
            featuresArr.push(this.state.featureObjFromArr[key])
          }
          i++;
        }
      }
     function selectId(featureId){
        this.setState({findSegId:featureId})
      }
    return featuresArr.map((feature,ind)=>{
      if(feature.properties.connections){
        let laneNum = feature.id.slice(-1);   
        let idNum = feature.id.slice(0,feature.id.length-1);
        var id = idNum + '.' + laneNum
      } else {
        var id = feature.id;
      }
  
      return (
        <div onClick={selectId.bind(this,feature.id)} key={ind} className="searchItemWrap">
          <div className="searchItem">{id}</div>
        </div>
      )
    })
    
  }
  findSegment=()=>{
    let stringId = this.state.findSegId.toString();
    var segId = stringId.indexOf('.') > 0 ? stringId.replace('.','') : stringId;
    let feature = this.state.featureObjFromArr[segId];
    //this.state.currAndPrevForClick.push(feature);
    let setStateAnd = new Promise((resolve,reject)=>{   
      this.state.currAndPrevForClick.push(feature);
      resolve();
     })
    if(feature===undefined){
      return;
    }
    setStateAnd.then(()=>{
      this.setState({selectedSeg:feature});
        
      if(feature.properties.connections){
          var connections = feature.properties.connections;
                
          this.set_click_connection_color("clickConnections", segId, connections.continue, "light-blue");
          this.set_click_connection_color("clickConnections", segId, connections.merge, "red");
          this.set_click_connection_color("clickConnections", segId, connections.split, "yellow");
          this.set_click_connection_color("clickConnections", segId, connections.right, "blue");
          this.set_click_connection_color("clickConnections", segId, connections.left, "purple");
       } 
          this.map.setFeatureState({source: 'clickConnections', id: segId}, { selectedConnections: true,
                                                                              color: 'green' })
      if(this.state.currAndPrevForClick.length > 1){                      
          var currAndPrevForClick = this.state.currAndPrevForClick.slice(-2);                  
          this.setState({ currAndPrevForClick: currAndPrevForClick });   
              
            if(this.state.currAndPrevForClick[0].id !== this.state.currAndPrevForClick[1].id){
              this.map.setFeatureState({source: 'clickConnections', id: this.state.currAndPrevForClick[0].id}, { selectedConnections: false,
                                                                                                                color: 'green'           });        
              if(this.state.currAndPrevForClick[0].properties.connections){
                    let connectionsObj4 = typeof this.state.currAndPrevForClick[0].properties.connections==='string'
                    ? JSON.parse(this.state.currAndPrevForClick[0].properties.connections)  
                    : this.state.currAndPrevForClick[0].properties.connections;
                    console.log(connectionsObj4)
                    this.set_click_connection_color("clickConnections", null, connectionsObj4.continue, "light-blue", false);
                    this.set_click_connection_color("clickConnections", null, connectionsObj4.merge, "red", false);
                    this.set_click_connection_color("clickConnections", null, connectionsObj4.split, "yellow", false);
                    this.set_click_connection_color("clickConnections", null, connectionsObj4.right, "blue", false);
                    this.set_click_connection_color("clickConnections", null, connectionsObj4.left, "purple", false);
                }   
            }         
        } 
     })
      let promise = new Promise((resolve,reject)=>{
         /* this.map.flyTo({center: feature.geometry.coordinates[feature.geometry.coordinates.length-1],
                          zoom:15,
                          curve: 1,
                          speed:.8,
                          easing(t) {
                            return t;
                          }})*/
         //console.log(this.map.getSource('segments'))
          this.pullOutOrInNav();
          this.setState({findSegId:''})
          this.state.viewport.longitude = feature.geometry.coordinates[feature.geometry.coordinates.length-1][0];
          this.state.viewport.latitude = feature.geometry.coordinates[feature.geometry.coordinates.length-1][1];
          this.state.viewport.zoom = 15;         
          resolve()
        })
        promise.then(()=>{
        ////kept this just in case i wanna change something////
           
         })
   }
  
  removeEgoLayer = () =>{
      this.car.remove();
      document.getElementById('localMapBtn').style.pointerEvents = 'none';
      document.getElementById('localMapBtn').style.color = 'gray';
      this.map.removeLayer('trace');
      this.map.removeSource('trace');
      document.getElementById('file-input2').value = '';  
      if(this.socketIdsArr){
        let lastConnections = this.state.featureObjFromArr[this.socketIdsArr[this.socketIdsArr.length-1]].properties.connections;
        this.set_click_connection_color("clickConnections", null, lastConnections.continue, "light-blue", false);
        this.set_click_connection_color("clickConnections", null, lastConnections.merge, "red", false);
        this.set_click_connection_color("clickConnections", null, lastConnections.split, "yellow", false);
        this.set_click_connection_color("clickConnections", null, lastConnections.right, "blue", false);
        this.set_click_connection_color("clickConnections", null, lastConnections.left, "purple", false);
        this.map.setFeatureState({source: 'clickConnections', id: this.socketIdsArr[this.socketIdsArr.length-1].id}, { selectedConnections: false,
                                                                                                                       color: 'green'           });        
      }
      this.socketIdsArr = [];
      this.egoCounter = 0;
   }
  handleEgoPoints = (e) => {
      document.getElementById('localMapBtn').style.pointerEvents = 'auto';
      document.getElementById('localMapBtn').style.color = 'white';
      let reader = new FileReader();
      reader.readAsText(e.target.files[0]);
      reader.onload = () => {     
          const egoPoints = JSON.parse(reader.result);
        
          let firstPoint = egoPoints.features[0].geometry.coordinates[0];
          let withFirstPoint = JSON.parse(JSON.stringify(egoPoints));
          withFirstPoint.features = [withFirstPoint.features[0]];
          withFirstPoint.features[0].geometry.coordinates = [firstPoint];
          //console.log(withFirstPoint, firstPoint, egoPoints)
          let promise = new Promise((resolve,reject)=>{
            this.setState({egoPoints:withFirstPoint});
            if(Object.keys(this.state.egoPoints).length>0){ 
              resolve();
             }      
           })
          
          promise.then(()=>{
            this.socket.emit('egoPoints', egoPoints.features);
          })      
       }
   }


  handleGeoJSONUpload = (e) => {  
    //console.log(document.getElementById('file-input').value)
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
            //console.log(geoJson);
            this.processData(geoJson);
            this.setState({i95Points:geoJson});
            resolve();
         })
          changeGeoJson.then(()=>{
              let panToPoints = this.state.i95Points.features[0].geometry.coordinates[0];
              this.map.getSource('segments').setData(this.state.i95Points)
              this.map.getSource('connectionSegs').setData(this.state.i95Points)
              this.map.getSource('clickConnections').setData(this.state.i95Points)
              this.map.getSource('segmentDivPoints').setData(this.state.segmentDivPoints)
              this._onViewportChange({
                longitude:panToPoints[0],
                latitude:panToPoints[1]
               });
              document.getElementById('file-input').value = '';
            })
       })
   }

    set_connection_color(layer, hover_id, cons, color, enable=true){
        if(cons !== undefined){
            cons.forEach(con_id => {
                if(hover_id === null || Number(con_id) !== hover_id){
                    this.map.setFeatureState({source: layer, id: con_id},
                                             {connection: enable, color: color});
                }
            });
        }
     }
    set_click_connection_color(layer, hover_id, cons, color, enable=true){
        if(cons !== undefined){
            cons.forEach(con_id => {
              if(con_id==hover_id){              
              }
                if(hover_id === null || Number(con_id) !== hover_id){
                    this.map.setFeatureState({source: layer, id: con_id},
                                            {selectedConnections: enable, color: color});
                }
            });
        }
     }
  click = (info) => {
    let feature = this.map.queryRenderedFeatures([info.offsetCenter.x,info.offsetCenter.y], {layers:['clickConnections']});
    if(feature.length===0){
    
          if(Object.keys(this.state.selectedSeg).length>0){ 
            //console.log(this.state.selectedSeg)
              this.map.setFeatureState({source: 'clickConnections', id: this.state.selectedSeg.id}, { selectedConnections: false,
                                                                                                      color: 'green'           });
              if(this.state.selectedSeg.properties.connections){
                    let connectionsObj = typeof this.state.selectedSeg.properties.connections=='string' 
                    ? JSON.parse(this.state.selectedSeg.properties.connections)  
                    : this.state.selectedSeg.properties.connections;

                    this.set_click_connection_color("clickConnections", null, connectionsObj.continue, "light-blue", false);
                    this.set_click_connection_color("clickConnections", null, connectionsObj.merge, "red", false);
                    this.set_click_connection_color("clickConnections", null, connectionsObj.split, "yellow", false);
                    this.set_click_connection_color("clickConnections", null, connectionsObj.right, "blue", false);
                    this.set_click_connection_color("clickConnections", null, connectionsObj.left, "purple", false);
                }
                    
          this.map.setFeatureState({source: 'clickConnections', id: this.state.hoveredSeg.id}, { hover: false});
          
        } 
        this.setState({selectedSegToolTip:{}});  
    }
   
      if(feature.length>0){
          var selectedSegId = feature[0].id;       
          this.state.currAndPrevForClick.push(feature[0]);
          this.setState({selectedSeg:feature[0]});
          this.setState({selectedSegToolTip:feature[0]});
            if (selectedSegId) {          
                this.map.setFeatureState({source: 'clickConnections', id: selectedSegId}, { selectedConnections: true,
                                                                                            color: 'green'           });
                if(feature[0].properties.connections){
                    var connections = typeof feature[0].properties.connections=='string'
                    ? JSON.parse(feature[0].properties.connections)
                    : feature[0].properties.connections;
                          
                    this.set_click_connection_color("clickConnections", selectedSegId, connections.continue, "light-blue");
                    this.set_click_connection_color("clickConnections", selectedSegId, connections.merge, "red");
                    this.set_click_connection_color("clickConnections", selectedSegId, connections.split, "yellow");
                    this.set_click_connection_color("clickConnections", selectedSegId, connections.right, "blue");
                    this.set_click_connection_color("clickConnections", selectedSegId, connections.left, "purple");
                 } 
              }            
       
       if(this.state.currAndPrevForClick.length > 1){                       
          var currAndPrevForClick = this.state.currAndPrevForClick.slice(-2);                  
          this.setState({ currAndPrevForClick: currAndPrevForClick });    
                          
          if(this.state.currAndPrevForClick[0].id !== this.state.currAndPrevForClick[1].id){
            this.map.setFeatureState({source: 'clickConnections', id: this.state.currAndPrevForClick[0].id}, { selectedConnections: false,
                                                                                                               color: 'green'           });        
            if(this.state.currAndPrevForClick[0].properties.connections){
                  let connectionsObj1 = typeof this.state.currAndPrevForClick[0].properties.connections=='string'
                  ? JSON.parse(this.state.currAndPrevForClick[0].properties.connections)  
                  :this.state.currAndPrevForClick[0].properties.connections
                  
                  this.set_click_connection_color("clickConnections", null, connectionsObj1.continue, "light-blue", false);
                  this.set_click_connection_color("clickConnections", null, connectionsObj1.merge, "red", false);
                  this.set_click_connection_color("clickConnections", null, connectionsObj1.split, "yellow", false);
                  this.set_click_connection_color("clickConnections", null, connectionsObj1.right, "blue", false);
                  this.set_click_connection_color("clickConnections", null, connectionsObj1.left, "purple", false);
              }
              this.map.setFeatureState({source: 'clickConnections', id: selectedSegId}, { selectedConnections: true,
                color: 'green'           });
            if(this.state.selectedSeg.properties.connections){
                  let connectionsObj1 = typeof this.state.selectedSeg.properties.connections=='string' 
                  ? JSON.parse(this.state.currAndPrevForClick[1].properties.connections)
                  : this.state.selectedSeg.properties.connections; 

                  this.set_click_connection_color("clickConnections", selectedSegId, connectionsObj1.continue, "light-blue");
                  this.set_click_connection_color("clickConnections", selectedSegId, connectionsObj1.merge, "red");
                  this.set_click_connection_color("clickConnections", selectedSegId, connectionsObj1.split, "yellow");
                  this.set_click_connection_color("clickConnections", selectedSegId, connectionsObj1.right, "blue");
                  this.set_click_connection_color("clickConnections", selectedSegId, connectionsObj1.left, "purple");
            }
           }
         }   
       }
   }
   /////////////////////////////////////////////
  hover=(info)=>{  
    var feature = this.map.queryRenderedFeatures([info.offsetCenter.x,info.offsetCenter.y],{layers:['segments']});
    if(feature.length===0){  
      if(Object.keys(this.state.hoveredSeg).length>0){ 
        if(this.state.currAndPrev[0].properties.connections){
            var connectionsObj0 = JSON.parse(this.state.currAndPrev[0].properties.connections)  

            this.set_connection_color("connectionSegs", null, connectionsObj0.continue, "light-blue", false);
            this.set_connection_color("connectionSegs", null, connectionsObj0.merge, "red", false);
            this.set_connection_color("connectionSegs", null, connectionsObj0.split, "yellow", false);
            this.set_connection_color("connectionSegs", null, connectionsObj0.right, "blue", false);
            this.set_connection_color("connectionSegs", null, connectionsObj0.left, "purple", false);
         }
          if(this.state.currAndPrev[1]){
            this.map.setFeatureState({source: 'segments', id: this.state.currAndPrev[0].id}, { hover: false});             
            if(this.state.currAndPrev[1].properties.connections){
                  var connectionsObj = JSON.parse(this.state.currAndPrev[1].properties.connections)  

                  this.set_connection_color("connectionSegs", null, connectionsObj.continue, "light-blue", false);
                  this.set_connection_color("connectionSegs", null, connectionsObj.merge, "red", false);
                  this.set_connection_color("connectionSegs", null, connectionsObj.split, "yellow", false);
                  this.set_connection_color("connectionSegs", null, connectionsObj.right, "blue", false);
                  this.set_connection_color("connectionSegs", null, connectionsObj.left, "purple", false);
              }
            }       
        this.map.setFeatureState({source: 'segments', id: this.state.hoveredSeg.id}, { hover: false});
        this.setState({hoveredSeg:{}})
       }         
     }
    //console.log(feature[0])
      if(feature.length>0){
          var hoveredSegId = feature[0].id;       
          this.state.currAndPrev.push(feature[0]);
          this.setState({hoveredSeg:feature[0]});
          if(this.state.currAndPrev.length > 2){                       
            var currAndPrev = this.state.currAndPrev.slice(-2);                  
            this.setState({ currAndPrev: currAndPrev });    
                            
            if(this.state.currAndPrev[0].id !== this.state.currAndPrev[1].id){
              this.map.setFeatureState({source: 'segments', id: this.state.currAndPrev[0].id}, { hover: false});
               if(this.state.currAndPrev[0].properties.connections){
                     let connectionsObj1 = JSON.parse(this.state.currAndPrev[0].properties.connections)  
                     
                     this.set_connection_color("connectionSegs", null, connectionsObj1.continue, "light-blue", false);
                     this.set_connection_color("connectionSegs", null, connectionsObj1.merge, "red", false);
                     this.set_connection_color("connectionSegs", null, connectionsObj1.split, "yellow", false);
                     this.set_connection_color("connectionSegs", null, connectionsObj1.right, "blue", false);
                     this.set_connection_color("connectionSegs", null, connectionsObj1.left, "purple", false);
                 }
               }
           }  
            if (hoveredSegId) {          
                this.map.setFeatureState({source: 'segments', id: hoveredSegId}, { hover: true});
                if(feature[0].properties.connections){
                    var connections = JSON.parse(feature[0].properties.connections)
                          
                    this.set_connection_color("connectionSegs", hoveredSegId, connections.continue, "light-blue");
                    this.set_connection_color("connectionSegs", hoveredSegId, connections.merge, "red");
                    this.set_connection_color("connectionSegs", hoveredSegId, connections.split, "yellow");
                    this.set_connection_color("connectionSegs", hoveredSegId, connections.right, "blue");
                    this.set_connection_color("connectionSegs", hoveredSegId, connections.left, "purple");
                 } 
              } 
              
          }
          
      
   }

   ///////////////////////////////////////////
   flipLocalMapBtn = () => {  
    let btn = document.querySelector('.localMapBtn');
     if(this.state.flipped ===false){
      this.map.setLayoutProperty('segments', 'visibility', 'none');
      this.map.setLayoutProperty('connectionSegs', 'visibility', 'none');
      this.map.setLayoutProperty('segmentDivPoints', 'visibility', 'none');
     
       btn.classList.remove('flipBack');
       btn.classList.add('flip');
     
       setTimeout(()=>{
        this.setState({flipped: true,
          flippedText: 'Show Whole Map'});
       },150)
       
     } else {
      this.map.setLayoutProperty('segments', 'visibility', 'visible');
      this.map.setLayoutProperty('connectionSegs', 'visibility', 'visible');
      this.map.setLayoutProperty('segmentDivPoints', 'visibility', 'visible');
      btn.classList.remove('flip');
       btn.classList.add('flipBack');
       this.setState({flipped: false,
                     flippedText: 'Show Local Map'});
     }
   }
  /////////////////////////////////////////
  _onViewportChange(viewport){
      this.setState({
        viewport: {...this.state.viewport, ...viewport}
       });
    }
  
    _resize=()=> {
      //window.addEventListener("resize",()=>{
        
        this._onViewportChange({
          width: window.innerWidth,
          height: window.innerHeight
        });
      //})
    }
    renderToolTip=(segment)=>{
        if(Object.keys(segment).length>0){
         //console.log(segment)
         function mapConnections(connections){
              return connections.map((connect, i)=>{
                let laneNum = connect.slice(-1)
                let id = connect.slice(0,connect.length-1)
                if(i===connections.length-1){              
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
      <div id="App" className="App">
      
     <ReactMapGL
      ref={(reactMap) => { this.reactMap = reactMap }} 
          {...this.state.viewport}
          mapStyle="mapbox://styles/pagnito/cjluz0klc24v72sp7471bbxwq"
          onViewportChange={viewport => this._onViewportChange(viewport)}
          onHover={this.hover}
          onClick={this.click}
          mapboxApiAccessToken={MAPBOX_TOKEN}>
          
          {/*<ArcLayer
            testerRoads={this.state.testerRoads}
            onHover={this.onHover}
            viewport={this.state.viewport}
            //arcs={this.state.points} 
          segments={this.state.segments}/>*/}
     </ReactMapGL>
     <i id="navBtn" onClick={this.pullOutOrInNav} className="fas fa-bars fa-bars-outside"></i>{/* icon that pulls nav out*/}
        <div id="controls">{/*controls is the slide navbar*/}
          <i  onClick={this.pullOutOrInNav} className="fas fa-bars"></i> {/*icon that pulls the nav back in*/}
          
          {/*//////////////////////////////////////////////////////*/}
         <div className="inputsWraps">
            <div className="inputParent"> {/* for any input use this structure of inputParent class and controlsInputItem*/ }
               <input value={this.state.findSegId} onChange={this.onChange} className="controlsInputItem" type="text" name="findSegId" placeholder="Find a segment"/>
               <i onClick={this.findSegment} className="fas searchBtn fa-search-location"></i>
            </div>
         </div>
         <div className="scrollBarHider">
            <div className="searchList">
                {this.queryFeatures(this.state.findSegId)}
            </div>
         </div>
         <div className="controlsTitleItem" >
               <input onChange={this.handleGeoJSONUpload} accept='json' type="file" name="file-input" id="file-input"></input>
               <label htmlFor="file-input">
               <i className="fas fa-upload"></i>
               </label>
                Upload Your GeoJson
        </div>
        <div className="controlsTitleItem" >
              <input onChange={this.handleEgoPoints} accept='json' type="file" name="file-input2" id="file-input2"></input>
               <label htmlFor="file-input2">
              <i className="fas fa-car"></i>
              </label>
               Animate Ego
        </div>
        <div className="controlsTitleItem" >
            <i onClick={this.removeEgoLayer} className="fas fa-recycle"></i>
               Clear Ego
        </div>
        <div id="localMapBtn" onClick={this.flipLocalMapBtn} className="localMapBtn controlsTitleItem" >
             <i className="fas fa-map-signs"></i>
               {this.state.flippedText}
        </div>
        </div>
         {/*//////////////////////////////////////////////////////*/}
        <div className="toolTipWrap">
          {this.renderToolTip(this.state.hoveredSeg)}
          {this.renderToolTip(this.state.selectedSegToolTip)}
        </div>
      </div>
    );
  }
}


export default App;
