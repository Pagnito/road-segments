import React, { Component } from 'react'
import DeckGL, {IconLayer} from 'deck.gl';
import carIcon from '../assets/car-icon-deckgl.png'
export default class arcLayer extends Component {


render() {
 

   var data = [
       { prevCoordinates: this.props.egoPoints[0],
         directionCoordinates:this.props.egoPoints[1]}]
                 
       
   
    const layers = [
        
      new IconLayer({
          id: 'icon-layer',
          data: data,
          pickable: true,
          iconAtlas: carIcon,
          iconMapping: {
            marker: {
              x: 0,
              y: 0,
              width: 80,
              height: 185,
             
            }
          },
          sizeScale: 20,
          getSize: d=>7,
          getPosition: d=>d.prevCoordinates,
          getIcon: d=>'marker',
          getAngle: d=> 30
      })
    ];

    return (
      <DeckGL {...this.props.viewport} layers={layers}/>
    );
  }

  
}
