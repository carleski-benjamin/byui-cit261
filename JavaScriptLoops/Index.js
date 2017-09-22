var equations = [];

function AddEquation()
{
	var equationList = document.getElementById("equationList");
	var index = equations.length;
	var leftOp = document.createElement('input');
	leftOp.id = 'leftOp' + index;
	leftOp.type = 'numeric';
	leftOp.value = 0;

	var rightOp = document.createElement('input');
	rightOp.id = 'rightOp' + index;
	rightOp.type = 'numeric';
	rightOp.value = 0;

	var result = document.createElement('input');
	result.id = 'result' + index;
	result.type = 'text';
	result.readonly = true;
	result.value = '0';

	var div = document.createElement('div');
	equationList.appendChild(div);
	div.appendChild(leftOp);
	div.appendChild(rightOp);
	div.appendChild(result);

	equations.push({ left: leftOp, right: rightOp, result: result });
}

function CalculateResults()
{
	for (var i = 0; i < equations.length; i++) {
		var eq = equations[i];
		var leftVal = parseFloat(eq.left.value);
		var rightVal = parseFloat(eq.right.value);

		if (!isNaN(leftVal) && !isNaN(rightVal)) {
			eq.result.value = leftVal * rightVal;
		}
	}	
}