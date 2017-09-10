import { Commit } from './commit'

export class Repo {
    about: About;
    commits: Commit[]
}

class About {
    repo: string;
    last: string;
}