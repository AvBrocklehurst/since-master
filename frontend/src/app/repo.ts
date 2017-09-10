import { Commit } from './commit'

export class Repo {
    about: About;
    commits: string[]
}

export class About {
    repo: string;
    last: string;
}