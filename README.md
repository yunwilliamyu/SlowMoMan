# <img src="images/graphics/SMM_Logo.svg" width="350" height="140">
Go to the Pages environment to try out SlowMoMan!
https://yunwilliamyu.github.io/SlowMoMan/
<img src="SlowMoMan.png" width="20" height="20">

2-dimensional embeddings allow humans to visualize high-dimensional data, as is often seen in bioinformatics, where data sets may have tens of thousands of dimensions. However, relating the axes of a nonlinear embedding to the original dimensions is a nontrivial problem. In particular, humans may identify patterns or interesting subsections in the embedding, but cannot easily identify what those patterns correspond to in the original data. 

Thus, we present SlowMoMan (SLOW MOtions on MANifolds), a web application which allows the user to draw a 1-dimensional path onto the 2-dimensional embedding. Then, by back projecting the manifold to the original, high-dimensional space, we sort the original features such that those most discriminative along the manifold are ranked highly. We show a number of pertinent use cases for our tools, including trajectory inference, spatial transcriptomics, and automatic cell classification.

If you wish to run the app locally, you'll need to run a local web server. If you have Python 3 installed, all you need to do is enter the command `python3 -m http.server -d <YOUR PATH TO THE SLOWMOMAN FOLDER>` in your terminal and visit the respective port on your internet browser (e.g., `localhost:8000`).
