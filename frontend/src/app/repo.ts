import { Commit } from './commit'

export class Repo {
    about: About;
    commits: Commit[]
}

export class About {
    repo: string;
    last: string;
}