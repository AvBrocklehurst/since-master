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

  constructor(private repoService: RepoService) { }

  ngOnInit(): void {
    this.getRepos();
  }

  getRepos(): void {
    this.repoService.getRepos().then(repos => this.repos = repos);
  }
  
}

