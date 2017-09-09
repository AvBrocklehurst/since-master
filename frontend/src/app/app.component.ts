import { Component, OnInit } from '@angular/core';
import { Commit } from './commit'
import { Repo } from './repo'
import { RepoService } from './repo.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [RepoService]
})

export class AppComponent implements OnInit {
  title = "Whats changed since master!";
  repos: Repo[];
  commits: Commit[] = [
    { id: "f8c9b89", message: 'Integrate chat, add hooks, fix bugs' },
    { id: "f8c9b89", message: 'Narco' },
    { id: "f8c9b89", message: 'Bombasto' },
    { id: "f8c9b89", message: 'Celeritas' },
    { id: "f8c9b89", message: 'Magneta' },
    { id: "f8c9b89", message: 'RubberMan' },
    { id: "f8c9b89", message: 'Dynama' }
  ];

  constructor(private repoService: RepoService) { }

  ngOnInit(): void {
    this.getRepos();
  }

  getRepos(): void {
    this.repoService.getRepos().then(repos => this.repos = repos);
  }
  
}

