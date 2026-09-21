import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'customModulesCount' })
export class CustomModulesCountPipe implements PipeTransform {
  transform(modules: any[]): number {
    return modules ? modules.filter(m => m.selectionne).length : 0;
  }
}
