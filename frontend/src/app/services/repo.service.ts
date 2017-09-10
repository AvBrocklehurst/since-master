import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Repo } from '../classes/repo'

import 'rxjs/add/operator/toPromise';

@Injectable()
export class RepoService {
    private repoURL = "localhost:3000/repos"

    constructor(private http: Http) { }

    getRepos(): Promise<Repo[]> {
        return this.http.get("http://localhost:3000/repos")
            .toPromise()
            .then(response => response.json() as Repo[])
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        return Promise.reject(error.message || error);
    }
}

