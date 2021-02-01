GITHUB_USER=meg768
GITHUB_PROJECT=strecket
GITHUB_URL=https://github.com/$(GITHUB_USER)/$(GITHUB_PROJECT)

all:
	@echo Specify something

react-scripts-start:
	npx react-scripts start

react-scripts-build:
	npx react-scripts build

git-commit:
	git add -A && git commit -m '-' && git push

git-pull:
	git pull

git-reset:
	git reset --hard HEAD

git-open:
	open $(GITHUB_URL).git

npm-publish:
	npm publish
	
