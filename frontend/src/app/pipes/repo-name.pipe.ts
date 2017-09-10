import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'repoName'})
export class RepoName implements PipeTransform {
  transform(path: string): string {
    let parts = path.split("/")
    return parts[parts.length-1]
  }
}