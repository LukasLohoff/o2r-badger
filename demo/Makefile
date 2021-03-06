create_images:
	mkdir -p images; \
	git clone -n https://github.com/o2r-project/o2r-badger; \
	cd o2r-badger; git checkout a363dfb5fef9ec4d661be26b091f362a4145cf1a; \
	docker build -t badger:demo .; \
	cd ..; \
	git clone -n https://github.com/o2r-project/o2r-extender; cd o2r-extender; \
	git checkout c09896e3b9354149b3bd8ed8b382bfc7aa36a57d; \
	cd ..; \
	git clone -n https://github.com/o2r-project/o2r-muncher; \
	cd o2r-muncher;	git checkout 0e2a5cfff68a6adeddcf43d2df42fde52849e6fc;	\
	docker build -t muncher:badger-demo .; \
	cd ..; \

	docker pull mongo:3.4; \
	docker tag mongo:3.4 mongo:badger-demo; \
	docker pull nginx:latest; \
	docker tag nginx:latest nginx:badger-demo;

save_images:
	docker save badger:demo > images/badger.tar; \
	docker save muncher:badger-demo > images/muncher.tar; \
	docker save mongo:badger-demo > images/mongo.tar; \
	docker save nginx:badger-demo > images/nginx.tar;

create_package: create_images save_images
	zip -r badger_demo.zip images o2r-extender o2r-badger o2r-muncher -x *.git* */node_modules/**\*; \
	cd o2r-badger/demo; \
	zip ../../badger_demo.zip README.md Makefile docker-compose.yml nginx.conf; \
	zip -r ../../badger_demo.zip html data; \

	rm -rf images/ o2r-badger/ o2r-muncher/ o2r-extender/; \
	docker rmi badger:demo muncher:badger-demo mongo:badger-demo nginx:badger-demo; \

download:
	wget https://zenodo.org/record/1199272/files/badger_demo.zip; \
	unzip badger_demo.zip -d badger_demo; \
	cd badger_demo;

reproduce:
	docker load --input images/muncher.tar; \
	docker load --input images/mongo.tar; \
	docker load --input images/badger.tar; \
	docker load --input images/nginx.tar; \
	docker-compose up;

clean_up:
	docker-compose down;