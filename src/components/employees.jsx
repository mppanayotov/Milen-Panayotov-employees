import React, { Component } from 'react';
import Papa from 'papaparse';
import Moment from 'moment';
import { extendMoment } from 'moment-range';
const moment = extendMoment(Moment);

class Employees extends Component {
  state = {
    hasUpload: false,
    employees: [],
    projects: [],
    peopleByProjects: [],
    timespan: [],
    intersections: [],
    result: []
  };

  handleUpload = (e) => {
    const uploadData = [];

    Papa.parse(e.target.files[0], {
      skipEmptyLines: true,
      step: function (results) {
        const employee = {
          name: results.data[0].trim(),
          project: results.data[1].trim(),
          start: results.data[2].trim(),
          end: results.data[3].trim()
        }

        uploadData.push(employee);
      },
      complete: function () {
        setEmployees();
      }
    });
    
    const setEmployees = () => {
      this.setState({ hasUpload: true });
      this.setState({ employees: uploadData }, this.detectProjects);
    };
  };

  detectProjects = () => {
    const employees = this.state.employees;
    const projects = [];

    for (let index = 0; index < employees.length; index++) {
      const current = employees[index].project;

      projects.indexOf(current) < 0 && projects.push(current);
    }

    this.setState({ projects: projects }, this.sortByProject);
  };

  sortByProject = () => {
    const employees = this.state.employees;
    const detectProjects = this.state.projects;
    const peopleByProjects = [];

    detectProjects.forEach(project => {
      const peopleByProject = [];

      employees.forEach(employee => {
        employee.project === project && peopleByProject.push(employee);
      });

      peopleByProjects.push(peopleByProject);
    });

    this.setState({ peopleByProjects: peopleByProjects }, this.countTime);
  };

  countTime = () => {
    const peopleByProjects = this.state.peopleByProjects;
    const timespan = this.state.timespan;

    peopleByProjects.forEach(peopleByProject => {
      const currentProject = {
        project: '',
        workers: []
      }

      if (peopleByProject.length <= 1) {
        return
      }

      peopleByProject.forEach(employee => {
        const start = Moment(employee.start);
        const end =
          (employee.end === 'NULL' && Moment()) ||
          Moment(employee.end);
        const timespan = {
          name: employee.name,
          timespan: moment.range(start, end).toString()
        };

        currentProject.workers.push(timespan);
        currentProject.project = employee.project;
      });

      timespan.push(currentProject);
    });

    timespan.forEach(currentTimespan => {
      const compare1 = moment.range(currentTimespan.workers[0].timespan);
      const compare2 = moment.range(currentTimespan.workers[1].timespan);
      const result = Math.floor(compare1.intersect(compare2)).valueOf() / 86400000;

      currentTimespan.cooperation = {
        duration: result,
        cooperationWorkers: [
          currentTimespan.workers[0].name,
          currentTimespan.workers[1].name
        ]
      }
    });

    this.setState({ timespan: timespan }, this.returnResult);
  }

  returnResult = () => {
    const result = [];
    const compareValues = this.state.timespan;
    const current = compareValues.reduce((prev, current) => {
      return prev.cooperation.duration > current.cooperation.duration ? prev : current;
    });

    result.push(current);
    this.setState({ result: result });
  }

  render() {
    return (
      <div>
        <input
          type="file"
          name="file"
          onChange={this.handleUpload}
          accept=".csv"
        />

        <div style={{ display: !this.state.hasUpload ? 'none' : ''}}>
          <h3>Parsed array with all data</h3>

          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Project</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {this.state.employees.map((employee, index) => (
                <tr key={index}>
                  <td>{employee.name}</td>
                  <td>{employee.project}</td>
                  <td>{employee.start}</td>
                  <td>{employee.end}</td>
                </tr>
              ))}
            </tbody>
          </table>


          <h3>Display by project</h3>

          {this.state.peopleByProjects.map((peopleByProject, index) => (
            <table key={index}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Project</th>
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                {peopleByProject.map((employee, index) => (
                  <tr key={index}>
                    <td>{employee.name}</td>
                    <td>{employee.project}</td>
                    <td>{employee.start}</td>
                    <td>{employee.end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

          <h3>Result</h3>

          {this.state.result.map((result, index) => (
            <p key={index}>
              Worker1: <b>{result.cooperation.cooperationWorkers[0]}</b>, Worker2: <b>{result.cooperation.cooperationWorkers[1]}</b>, Duration worked (days): <b>{result.cooperation.duration}</b>
            </p>
          ))}
        </div>
      </div>
    );
  }
}

export default Employees;