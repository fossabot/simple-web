(async () => {

   const fse = require('fs-extra');
   const exec = require('../.web/modules/execShellCommand');
   const { sh, draft } = require('../.web/modules/sh');
   const { build } = require('../.web/modules/receive-args');
   const { EOL } = require('os');
   const rebuildFiles = require('../bin/rebuild-files.js');
   const [ ,, ...args ] = process.argv;
   const arg = args[0]?.replace(/-/g, '') || 'start';
   const normalize = require('path').normalize;
   const requires = {

      dirs: [

         '.library'
      ],
      files: [

         '.babelrc',
         '.eslintrc.js'
      ]
   };
   const alloweds = {

      init: true,
      start: '../.web/tasks/start',
      build: '../.web/tasks/build'
   };

   if (!alloweds[arg]) {
      
      console.error(`Command "${arg}" not found.${EOL}Use "init", "start" or "build".${EOL}`);
      return;
   }

   console.log(sh.clear);
   const importing = new draft(`Importing required local modules: ${sh.green}${sh.dim}[ ${sh.italic}autoprefixer, babel, eslint, postcss, sass and uglifyjs${sh.reset}${sh.green}${sh.dim} ]`);

   requires.dirs.forEach(require => fse.copySync(normalize(`${__dirname}/../${require}`), normalize(`./${require}`), { overwrite: false }));
   requires.files.forEach(require => {

      if (!fse.existsSync(normalize(`./${require}`))) fse.copyFileSync(normalize(`${__dirname}/../${require}`), normalize(`./${require}`));
   });

   if (!fse.existsSync(normalize('./package.json'))) {
      

      fse.copyFileSync(normalize(`${__dirname}/../.github/workflows/resources/_package.json`), normalize('./package.json'));         
      await exec('npm i');
   }
   if (!fse.existsSync(normalize('./.web-config.json'))) fse.copyFileSync(normalize(`${__dirname}/../.github/workflows/resources/_web-config.json`), normalize('./.web-config.json'));
   if (!fse.existsSync(normalize('./.web-replace.json'))) fse.copyFileSync(normalize(`${__dirname}/../.github/workflows/resources/_web-replace.json`), normalize('./.web-replace.json'));
   if (!fse.existsSync(normalize('./.eslintignore'))) fse.copyFileSync(normalize(`${__dirname}/../.github/workflows/resources/_eslintignore`), normalize('./.eslintignore'));
   if (!fse.existsSync(normalize('./.gitignore'))) fse.copyFileSync(normalize(`${__dirname}/../.github/workflows/resources/_gitignore`), normalize('./.gitignore'));
   else {
      
      let gitignore = fse.readFileSync(normalize('./.gitignore'), 'utf-8');
      const toIgnore = [
         
         '.main',
         '.release',
         'src/exit',
         '.web-config.json'
      ];
      
      toIgnore.forEach(ignore => {
         
         const regex = RegExp(ignore, 'gm');
         
         if (!regex.test(gitignore)) gitignore += `${EOL}${ignore}`;
      });
      
      fse.writeFileSync(normalize('./.gitignore'), gitignore);
   }
   
   const rebuilded = await rebuildFiles();
   
   importing.stop(1);

   if (!rebuilded) return;

   if (typeof alloweds[arg] === 'string') require(alloweds[arg]); /* Calls to script */
})();