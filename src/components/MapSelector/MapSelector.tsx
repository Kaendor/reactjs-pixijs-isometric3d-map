import React, { Component, createRef } from 'react';
import { Map, TileLayer } from 'react-leaflet';
import { LatLngLiteral, LeafletMouseEvent } from 'leaflet';
import AreaSelector from '../AreaSelector/AreaSelector';
import 'leaflet/dist/leaflet.css';

// TODO: change state in order to have multiple steps: frameDisabled, frameEnabled, selectScale (steps), getData
// TODO: add a slider when on state "selectScale (steps)"
// TODO: add a bouton "get data"
type Props = {
  onFetchDataInit?: () => void;
  onFetchData: (data: JSON) => void;
};

type State = {
  lat: number;
  lng: number;
  zoom: number;
  frameX: number;
  frameY: number;
  frameWidth: number;
  frameHeight: number;
  frameEnabled: boolean;
};

interface IMapArea {
  lat: number;
  lng: number;
  width: number;
  height: number;
}

export default class MapSelector extends Component<Props, State> {
  private map: React.RefObject<Map>;
  private mapArea: IMapArea;

  constructor(props: any) {
    super(props);

    this.map = createRef();
    this.mapArea = {
      lat: 0,
      lng: 0,
      width: 0,
      height: 0
    };

    this.state = {
      lat: 51.505,
      lng: -0.09,
      zoom: 13,
      frameX: 0,
      frameY: 0,
      frameWidth: 0,
      frameHeight: 0,
      frameEnabled: false
    };

    this.handleClickLeaflet = this.handleClickLeaflet.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.updateStateAfterClick = this.updateStateAfterClick.bind(this);
  }

  addMouseMoveHandler(add: boolean = true) {
    if (add) {
      window.addEventListener('mousemove', this.handleMouseMove);
    } else {
      window.removeEventListener('mousemove', this.handleMouseMove);
    }
  }

  handleClickLeaflet(event: LeafletMouseEvent) {
    this.updateStateAfterClick(
      event.containerPoint.x,
      event.containerPoint.y,
      event.latlng.lat,
      event.latlng.lng
    );
    this.addMouseMoveHandler(this.state.frameEnabled);
  }

  handleMouseMove(event: MouseEvent) {
    const { frameX, frameY } = this.state;
    this.setState({
      frameWidth: event.clientX - frameX,
      frameHeight: event.clientY - frameY
    });
  }

  fetchDataInit() {
    if (this.props.onFetchDataInit) {
      this.props.onFetchDataInit.call(this);
    }
  }

  fetchData(area: IMapArea) {
    const { lat, lng, width, height } = area;
    this.fetchDataInit();
    fetch(
      `http://${process.env.REACT_APP_API_HOST}:${process.env.REACT_APP_API_PORT}/data/${lat},${lng},${width},${height},50`
    )
      .then(async response => {
        const json = await response.json();
        this.props.onFetchData.call(this, json);
      })
      .catch((error: Error) => {
        console.log(`Error fetching data: ${error.message}`);
      });
  }

  updateStateAfterClick(x: number, y: number, lat: number, lng: number) {
    this.setState(
      prevState => ({
        frameEnabled: !prevState.frameEnabled,
        frameX: x,
        frameY: y
      }),
      () => {
        if (this.state.frameEnabled) {
          this.mapArea = {
            lat,
            lng,
            width: 0,
            height: 0
          };
        } else {
          this.mapArea.width = lng - Number(this.mapArea.lng);
          this.mapArea.height = Number(this.mapArea.lat) - lat;
          this.fetchData(this.mapArea);
        }
      }
    );
  }

  render() {
    const position: LatLngLiteral = {
      lat: this.state.lat,
      lng: this.state.lng
    };
    return (
      <>
        {this.state.frameEnabled && (
          <AreaSelector
            x={this.state.frameX}
            y={this.state.frameY}
            width={this.state.frameWidth}
            height={this.state.frameHeight}
          />
        )}
        <Map
          ref={this.map}
          className="map-component"
          style={{ width: '100%', height: '600px' }}
          center={position}
          zoom={this.state.zoom}
          onclick={this.handleClickLeaflet}
        >
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </Map>
      </>
    );
  }
}
