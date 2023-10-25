---
title: "A Physics-Constrained Neural Network for Multiphase Flows"
collection: publications
permalink: /publication/20220803_multiphase
links: '[[link]](https://pubs.aip.org/aip/pof/article/34/10/102102/2846791)'
author: '<strong>Haoyang Zheng</strong>, Ziyang Huang, Guang Lin'
date: 2022-08-03
venue: 'Physics of Fluids'
---

<strong>Abstract:</strong>
The present study develops a physics-constrained neural network (PCNN) to predict sequential patterns and motions of multiphase flows (MPFs), which includes strong interactions among various fluid phases. To predict the order parameters, which locate individual phases in the future time, a neural network (NN) is applied to quickly infer the dynamics of the phases by encoding observations. The multiphase consistent and conservative boundedness mapping algorithm (MCBOM) is next implemented to correct the predicted order parameters. This enforces the predicted order parameters to strictly satisfy the mass conservation, the summation of the volume fractions of the phases to be unity, the consistency of reduction, and the boundedness of the order parameters. Then, the density of the fluid mixture is updated from the corrected order parameters. Finally, the velocity in the future time is predicted by another NN with the same network structure, but the conservation of momentum is included in the loss function to shrink the parameter space. The proposed PCNN for MPFs sequentially performs (NN)-(MCBOM)-(NN), which avoids nonphysical behaviors of the order parameters, accelerates the convergence, and requires fewer data to make predictions. Numerical experiments demonstrate that the proposed PCNN is capable of predicting MPFs effectively.

<strong>Keywords:</strong>
Data acquisition; Neural networks; Mathematical modeling; Fluid flows; Multiphase flows
