export interface CodeExample {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: 'nested-loop',
    name: 'Nested Loop',
    description: 'Simple nested for loop example',
    code: `package main

import "fmt"

func main() {
	// Simple nested loop example
	for i := 0; i < 3; i++ {
		for j := 0; j < 2; j++ {
			fmt.Println(i, j)
		}
	}
}
`,
  },
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    description: 'Classic bubble sort algorithm',
    code: `package main

import "fmt"

func main() {
	arr := []int{5, 2, 8, 1, 9}
	n := 5
	
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if arr[j] > arr[j+1] {
				// Swap
				temp := arr[j]
				arr[j] = arr[j+1]
				arr[j+1] = temp
			}
		}
	}
	
	fmt.Println("Sorted:", arr)
}
`,
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci',
    description: 'Generate Fibonacci sequence',
    code: `package main

import "fmt"

func main() {
	n := 10
	a := 0
	b := 1
	
	fmt.Println(a)
	fmt.Println(b)
	
	for i := 2; i < n; i++ {
		c := a + b
		fmt.Println(c)
		a = b
		b = c
	}
}
`,
  },
  {
    id: 'factorial',
    name: 'Factorial',
    description: 'Calculate factorial iteratively',
    code: `package main

import "fmt"

func main() {
	n := 5
	result := 1
	
	for i := 1; i <= n; i++ {
		result = result * i
		fmt.Println(i, "! =", result)
	}
}
`,
  },
  {
    id: 'prime-check',
    name: 'Prime Number',
    description: 'Check if a number is prime',
    code: `package main

import "fmt"

func main() {
	num := 17
	isPrime := true
	
	if num < 2 {
		isPrime = false
	}
	
	for i := 2; i*i <= num; i++ {
		if num%i == 0 {
			isPrime = false
		}
	}
	
	if isPrime {
		fmt.Println(num, "is prime")
	} else {
		fmt.Println(num, "is not prime")
	}
}
`,
  },
  {
    id: 'sum-digits',
    name: 'Sum of Digits',
    description: 'Calculate sum of digits in a number',
    code: `package main

import "fmt"

func main() {
	num := 12345
	sum := 0
	original := num
	
	for num > 0 {
		digit := num % 10
		sum = sum + digit
		num = num / 10
		fmt.Println("Digit:", digit, "Sum:", sum)
	}
	
	fmt.Println("Sum of digits of", original, "is", sum)
}
`,
  },
  {
    id: 'countdown',
    name: 'Countdown',
    description: 'Simple countdown loop',
    code: `package main

import "fmt"

func main() {
	for i := 10; i >= 0; i-- {
		if i == 0 {
			fmt.Println("Liftoff!")
		} else {
			fmt.Println(i)
		}
	}
}
`,
  },
  {
    id: 'multiplication-table',
    name: 'Multiplication Table',
    description: '5x5 multiplication table',
    code: `package main

import "fmt"

func main() {
	size := 5
	
	for i := 1; i <= size; i++ {
		for j := 1; j <= size; j++ {
			product := i * j
			fmt.Print(product, " ")
		}
		fmt.Println()
	}
}
`,
  },
];
