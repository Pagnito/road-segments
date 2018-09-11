import React, { Component } from 'react'
import DeckGL, {GeoJsonLayer, ArcLayer, LineLayer} from 'deck.gl';

export default class arcLayer extends Component {


render() {
   /* if (!this.props.arcs) {
     
      return null;
    }*/
    if (!this.props.segments) {
     
      return null;
    }
   
    const layers = [
     /*new GeoJsonLayer({
        id: 'geojson-layer',
        data:this.props.segments,
        pickable: true,
        filled: true,
        extruded: false,
        getLineColor: d=>d.properties.color,
        
        lineWidthScale: 3,
        lineWidthMinPixels: 1,
        onHover:this.props.onHover,
        updateTriggers: {
          getLineColor: d=>d.properties.color
        },
      }),
      new LineLayer({
        id: 'line-layer',
        data:this.props.testerRoads,
        pickable: true,
        filled: true,
        extruded: false,
        
        getColor: [179, 244, 66,500],
        getSourcePosition: d => d.from,
        getTargetPosition: d => d.to,
        getStrokeWidth: 10,
 
       
      })*/
        /*,
      new ArcLayer({
        id: 'arc',
        data: this.props.arcs,
        pickable:true,
        getSourcePosition: d => d.from,
        getTargetPosition: d => d.to,
        getSourceColor:  [12, 44, 132],
        getTargetColor:  [254, 217, 118],
        strokeWidth: 5
      })*/
    ];

    return (
      <DeckGL {...this.props.viewport} layers={layers} onWebGLInitialized={this._initialize}/>
    );
  }

  
}
