import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import XLSX from 'xlsx';
import { make_cols } from './MakeColumns';
import './App.css';
import axios from 'axios';

class App extends React.Component{

  constructor(props){
    super(props);
    this.state = {
      selectedFile: {},
      data: [],
      cols: [],
      members: 0,
      teams: [],
      mmbrs: [],
      selectedTeam:'',
      validationError: ''
    };
    
    this.handleFile = this.handleFile.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.getReport = this.getReport.bind(this);
  }

  componentDidMount(){
    fetch("http://localhost:8080/api/teams")
    .then((response) => {
      return response.json();
    })
    .then(data => {
     console.log('data',data);
     console.log('keys',Object.keys(data));
     console.log('values',Object.values(data));
     let valmembers = Object.values(data);
     console.log('valmembers', valmembers);

     // var officersIds = [];
    //  valmembers[0].forEach(function (officer) {
    //     officersIds.push(officer.Assignee_ID);
    //   });

     let teamsFromApi = valmembers[0].map((team) => {
      return {value: team.Assignee_ID, display: team.Assignee_Name}
    });
    console.log('teamsFromApi',teamsFromApi);

     this.setState({
      teams: [{value: '', display: '--Select Team Members--'}].concat(teamsFromApi)
    });
    })
    .catch(error => {
      console.log(error);
    });
  }

  handleChange(e) {
    const files = e.target.files;
    if(files && files[0]) {
      this.setState({selectedFile: files[0]});
    }
  }

  handleFile() {
    /* Boilerplate to set up FileReader */
    const reader = new FileReader();
    const rABS = !!reader.readAsBinaryString;

    reader.onload = (e) => {
      /* Parse data */
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: rABS ? 'binary' : 'array', bookVBA : true });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_json(ws);
      /* Update state */
      this.setState({ data: data, cols: make_cols(ws['!ref']) }, () => {
        //console.log(JSON.stringify(this.state.data, null, 2));
      });

      /*convert exceldata to json object and send to nodejs server*/
      var objdata = JSON.stringify(this.state.data, null, 2);
      console.log("Data: " + objdata);// shows that excel data is read
      axios
      .post('http://localhost:8080/upload',JSON.parse(objdata),{})
      .then(res => {
        console.log(res.statusText);
      })
      .catch(err =>{
        console.log('Error encountered while posting jsondata '+err);
      });

    };
 
    if (rABS) {
      reader.readAsBinaryString(this.state.selectedFile);
    } else {
      reader.readAsArrayBuffer(this.state.selectedFile);
    };
  }

  getReport(){
     console.log({selectedId:JSON.parse(this.state.selectedTeam)});
    // console.log(typeof(this.state.selectedTeam));
    axios
    .post('http://localhost:8080/api/report',{selectedId:JSON.parse(this.state.selectedTeam)},{})
    .then(res => {
      console.log('Report response.data',res.data);
      console.log('Report keys',Object.keys(res.data));
      console.log('Report values',Object.values(res.data));
      let reportData = Object.values(res.data);

      let openTimes = [];
      reportData[0].forEach(function (ticket) {
        openTimes.push(ticket.OpenTime.slice(0,10));
       });
      //console.log('OpenTime', openTimes)

      let ageingDays = []
      openTimes.forEach(function (element){
        let givenDate = new Date(element)
        let currentDate = new Date() 
        let Difference_In_Time = currentDate.getTime() - givenDate.getTime(); 
        let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
        ageingDays.push(Math.round(Difference_In_Days));
      });
      console.log('AgeingDays', ageingDays)

      let i = -1;
      reportData[0].forEach(function (item){
        i++;
        for(let j = i; j < ageingDays.length; j++){
          item.Ageing_Days = ageingDays[j];
          return;
        }
      })

      this.setState({
        mmbrs: [].concat(reportData[0])
      },
      () => console.log('mmbrs',this.state.mmbrs)
      );
    })
    .catch(err =>{
      console.log('Error encountered while posting members '+err);
    })
  }

  renderTableData(){
    return this.state.mmbrs.map((mem, index) =>{
      const{ID, Interaction_ID, Title, Status, OpenTime, Ageing_Days} = mem
      return(
        <tr style={{border: '1px solid black'}} key={ID}>
        <td style={{border: '1px solid black', padding: '10px'}}>{ID}</td>
        <td style={{border: '1px solid black',padding: '10px'}}>{Interaction_ID}</td>
        <td style={{border: '1px solid black',padding: '10px'}}>{Title}</td>
        <td style={{border: '1px solid black', padding: '10px'}}>{Status}</td>
        <td style={{border: '1px solid black', padding: '10px'}}>{OpenTime}</td>
        <td style={{border: '1px solid black', padding: '10px'}}>{Ageing_Days}</td>
        <td style={{border: '1px solid black', padding: '10px'}}><button>Notify</button></td>
        </tr>
      )
    }

    )
  }
  render(){
    return(
      <div>
      <div style={{textAlign: 'center', border: '1px solid black', width: '90%', margin: '20px'}}>
            <h1>Estimated Time of Arrival (ETA)</h1>
      </div>
      <br/>
        <div style={{border: '1px solid black', width: '30%',margin: '20px', padding: '20px'}}>
        <h4>File Upload using React</h4>
        <input type='file' onChange={this.handleChange}></input>
        <button onClick={this.handleFile}>Upload</button>
        </div>
        <br/>
        <div style={{border: '1px solid black', width: '30%',margin: '20px', padding: '20px'}}>
          <select 
          value={this.state.selectedTeam}
          onChange={(e) => this.setState({selectedTeam: e.target.value, 
            validationError: e.target.value === "" ? "You must select your favourite team" : ""})} 
          >
          {this.state.teams.map((team) => <option key={team.value} value={team.value}> {team.display} </option>)}

          </select> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          
          <button onClick={this.getReport}>View Report</button>
        </div>
        <div style={{color: 'red', marginTop: '5px'}}>
          {this.state.validationError}
        </div>
        <div>
        <table style={{border: '1px solid black', width: '90%', margin: '20px'}}>
        <tbody style={{border: '1px solid black'}}>
        <tr style={{border: '1px solid black'}}>
        <td style={{border: '1px solid black',padding: '10px', backgroundColor: 'hsl(120,100%,70%)'}}> ID </td>
        <td style={{border: '1px solid black',padding: '10px', backgroundColor: 'hsl(120,100%,70%)'}}>Interaction_ID</td>
        <td style={{border: '1px solid black',padding: '10px', backgroundColor: 'hsl(120,100%,70%)'}}>Title</td>
        <td style={{border: '1px solid black', padding: '10px', backgroundColor: 'hsl(120,100%,70%)'}}>Status</td>
        <td style={{border: '1px solid black', padding: '10px', backgroundColor: 'hsl(120,100%,70%)'}}>OpenTime</td>
        <td style={{border: '1px solid black', padding: '10px', backgroundColor: 'hsl(120,100%,70%)'}}>Ageing_Days</td>
        <td style={{border: '1px solid black', padding: '10px', backgroundColor: 'hsl(120,100%,70%)'}}>Notify</td>
        </tr>
            {this.renderTableData()}
      </tbody>
        </table>
        </div>
      </div>
    );
  }
}

export default App;
